/**
 * PaperTradingService — server-side only.
 *
 * All database access goes through this service. Never import on the client.
 *
 * Responsibilities:
 *   • Wallet CRUD (create, deposit, withdraw)
 *   • Order placement (market / limit / stop execution)
 *   • Pending-order matching (called periodically with live LTPs)
 *   • Position netting (FIFO weighted-average; realizes P&L on close)
 *   • Trade journal writes
 *   • Stats aggregation
 *   • MIS auto square-off at 3:20 PM IST
 */

import type { Position, PaperOrder } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { computeSlippage, limitHit, stopTriggered } from "@/lib/paper-trading/slippage";
import type {
  PlaceOrderRequest,
  PositionData,
  TradingStats,
  PaperOrderData,
  WalletData,
  TradeData,
} from "@/types/paper-trading.types";

// ── Helpers ────────────────────────────────────────────────────────────────────

const DEFAULT_BALANCE = 1_000_000; // ₹10 lakh

function positionToData(
  pos: Position,
  ltp: number,
): PositionData {
  const avgEntry    = pos.netQty >= 0 ? pos.avgBuyPrice : pos.avgSellPrice;
  const investedVal = Math.abs(pos.netQty) * avgEntry;
  const currentVal  = Math.abs(pos.netQty) * ltp;
  const unrealized  = pos.netQty >= 0
    ? (ltp - pos.avgBuyPrice) * pos.netQty
    : (pos.avgSellPrice - ltp) * Math.abs(pos.netQty);
  const unrealizedPct = investedVal > 0 ? (unrealized / investedVal) * 100 : 0;

  return {
    ...pos,
    openedAt:      pos.openedAt.toISOString(),
    ltp,
    unrealizedPnl: Math.round(unrealized * 100) / 100,
    unrealizedPct: Math.round(unrealizedPct * 100) / 100,
    currentValue:  Math.round(currentVal * 100) / 100,
    investedValue: Math.round(investedVal * 100) / 100,
  };
}

function orderToData(o: PaperOrder): PaperOrderData {
  return {
    ...o,
    rejectionReason: o.rejectionReason ?? null,
    notes:           o.notes ?? null,
    placedAt:        o.placedAt.toISOString(),
    filledAt:        o.filledAt?.toISOString() ?? null,
    cancelledAt:     o.cancelledAt?.toISOString() ?? null,
  };
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export async function getOrCreateWallet(clientCode: string): Promise<WalletData> {
  const wallet = await prisma.wallet.upsert({
    where:  { clientCode },
    create: {
      clientCode,
      balance:        DEFAULT_BALANCE,
      totalDeposited: DEFAULT_BALANCE,
      transactions:   {
        create: {
          type:         "DEPOSIT",
          amount:       DEFAULT_BALANCE,
          balanceBefore:0,
          balanceAfter: DEFAULT_BALANCE,
          description:  "Initial virtual balance",
        },
      },
    },
    update: {},
  });
  return { ...wallet, createdAt: wallet.createdAt.toISOString(), updatedAt: wallet.updatedAt.toISOString() };
}

export async function depositToWallet(
  walletId: string,
  amount:   number,
  note      = "Manual deposit",
): Promise<WalletData> {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
  const updated = await prisma.$transaction(async (tx) => {
    const w = await tx.wallet.update({
      where: { id: walletId },
      data:  {
        balance:        { increment: amount },
        totalDeposited: { increment: amount },
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId,
        type:         "DEPOSIT",
        amount,
        balanceBefore:wallet.balance,
        balanceAfter: w.balance,
        description:  note,
      },
    });
    return w;
  });
  return { ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() };
}

export async function withdrawFromWallet(
  walletId: string,
  amount:   number,
): Promise<WalletData> {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
  const freeBalance = wallet.balance - wallet.usedMargin;
  if (amount > freeBalance) {
    throw new Error(`Cannot withdraw ₹${amount.toFixed(0)} — only ₹${freeBalance.toFixed(0)} is free`);
  }
  const updated = await prisma.$transaction(async (tx) => {
    const w = await tx.wallet.update({
      where: { id: walletId },
      data:  {
        balance:       { decrement: amount },
        totalWithdrawn:{ increment: amount },
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId,
        type:         "WITHDRAW",
        amount,
        balanceBefore:wallet.balance,
        balanceAfter: w.balance,
        description:  "Manual withdrawal",
      },
    });
    return w;
  });
  return { ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() };
}

export async function resetWallet(walletId: string): Promise<WalletData> {
  await prisma.$transaction([
    prisma.trade.deleteMany({ where: { walletId } }),
    prisma.position.deleteMany({ where: { walletId } }),
    prisma.paperOrder.deleteMany({ where: { walletId } }),
    prisma.walletTransaction.deleteMany({ where: { walletId } }),
    prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance:       DEFAULT_BALANCE,
        usedMargin:    0,
        totalDeposited:DEFAULT_BALANCE,
        totalWithdrawn:0,
        realizedPnl:   0,
      },
    }),
  ]);
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
  await prisma.walletTransaction.create({
    data: {
      walletId,
      type:          "DEPOSIT",
      amount:        DEFAULT_BALANCE,
      balanceBefore: 0,
      balanceAfter:  DEFAULT_BALANCE,
      description:   "Account reset",
    },
  });
  return { ...wallet, createdAt: wallet.createdAt.toISOString(), updatedAt: wallet.updatedAt.toISOString() };
}

// ── Position netting ──────────────────────────────────────────────────────────

async function netPosition(
  tx:         Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  walletId:   string,
  fill: {
    tradingsymbol:   string;
    symboltoken:     string;
    exchange:        string;
    producttype:     string;
    side:            "BUY" | "SELL";
    qty:             number;
    fillPrice:       number;
    slippagePct:     number;
    orderId:         string;
  },
): Promise<number> {  // returns realized P&L for this fill
  const existing = await tx.position.findUnique({
    where: {
      walletId_tradingsymbol_producttype: {
        walletId,
        tradingsymbol: fill.tradingsymbol,
        producttype:   fill.producttype,
      },
    },
  });

  let realizedPnl = 0;

  if (!existing || existing.netQty === 0) {
    // ── Opening a new position ────────────────────────────────────────────────
    await tx.position.upsert({
      where: {
        walletId_tradingsymbol_producttype: {
          walletId,
          tradingsymbol: fill.tradingsymbol,
          producttype:   fill.producttype,
        },
      },
      create: {
        walletId,
        tradingsymbol: fill.tradingsymbol,
        symboltoken:   fill.symboltoken,
        exchange:      fill.exchange,
        producttype:   fill.producttype,
        netQty:        fill.side === "BUY" ? fill.qty : -fill.qty,
        avgBuyPrice:   fill.side === "BUY" ? fill.fillPrice : 0,
        avgSellPrice:  fill.side === "SELL" ? fill.fillPrice : 0,
        buyQty:        fill.side === "BUY" ? fill.qty : 0,
        sellQty:       fill.side === "SELL" ? fill.qty : 0,
        lastLtp:       fill.fillPrice,
      },
      update: {
        netQty:        fill.side === "BUY" ? fill.qty : -fill.qty,
        avgBuyPrice:   fill.side === "BUY" ? fill.fillPrice : 0,
        avgSellPrice:  fill.side === "SELL" ? fill.fillPrice : 0,
        buyQty:        fill.side === "BUY" ? fill.qty : 0,
        sellQty:       fill.side === "SELL" ? fill.qty : 0,
        lastLtp:       fill.fillPrice,
      },
    });
  } else {
    const existingQty = existing.netQty;
    const isLong      = existingQty > 0;
    const isSameDir   = (fill.side === "BUY" && isLong) || (fill.side === "SELL" && !isLong);

    if (isSameDir) {
      // ── Add to existing position (weighted avg) ───────────────────────────
      const absExisting = Math.abs(existingQty);
      const newTotal    = absExisting + fill.qty;
      const newAvg      = isLong
        ? (absExisting * existing.avgBuyPrice + fill.qty * fill.fillPrice) / newTotal
        : (absExisting * existing.avgSellPrice + fill.qty * fill.fillPrice) / newTotal;

      await tx.position.update({
        where: { id: existing.id },
        data: {
          netQty:       isLong ? newTotal : -newTotal,
          avgBuyPrice:  isLong ? newAvg : existing.avgBuyPrice,
          avgSellPrice: isLong ? existing.avgSellPrice : newAvg,
          buyQty:       { increment: fill.side === "BUY"  ? fill.qty : 0 },
          sellQty:      { increment: fill.side === "SELL" ? fill.qty : 0 },
          lastLtp:      fill.fillPrice,
        },
      });
    } else {
      // ── Closing (or reversing) position ──────────────────────────────────
      const absExisting = Math.abs(existingQty);
      const closingQty  = Math.min(absExisting, fill.qty);
      const residualQty = fill.qty - closingQty;

      const avgEntry = isLong ? existing.avgBuyPrice : existing.avgSellPrice;
      realizedPnl    = isLong
        ? (fill.fillPrice - avgEntry) * closingQty
        : (avgEntry - fill.fillPrice) * closingQty;
      realizedPnl    = Math.round(realizedPnl * 100) / 100;

      if (closingQty === absExisting) {
        // Full close
        await tx.position.delete({ where: { id: existing.id } });
      } else {
        // Partial close
        await tx.position.update({
          where: { id: existing.id },
          data:  {
            netQty:  isLong ? absExisting - closingQty : -(absExisting - closingQty),
            sellQty: { increment: fill.side === "SELL" ? closingQty : 0 },
            buyQty:  { increment: fill.side === "BUY"  ? closingQty : 0 },
            realizedPnl: { increment: realizedPnl },
            lastLtp: fill.fillPrice,
          },
        });
      }

      // Open residual as new position (reversal)
      if (residualQty > 0) {
        await tx.position.create({
          data: {
            walletId,
            tradingsymbol: fill.tradingsymbol,
            symboltoken:   fill.symboltoken,
            exchange:      fill.exchange,
            producttype:   fill.producttype,
            netQty:        fill.side === "BUY" ? residualQty : -residualQty,
            avgBuyPrice:   fill.side === "BUY"  ? fill.fillPrice : 0,
            avgSellPrice:  fill.side === "SELL" ? fill.fillPrice : 0,
            buyQty:        fill.side === "BUY"  ? residualQty : 0,
            sellQty:       fill.side === "SELL" ? residualQty : 0,
            lastLtp:       fill.fillPrice,
          },
        });
      }
    }
  }

  // Append immutable trade record
  await tx.trade.create({
    data: {
      walletId,
      orderId:         fill.orderId,
      tradingsymbol:   fill.tradingsymbol,
      symboltoken:     fill.symboltoken,
      exchange:        fill.exchange,
      transactiontype: fill.side,
      producttype:     fill.producttype,
      quantity:        fill.qty,
      fillPrice:       fill.fillPrice,
      slippagePct:     fill.slippagePct,
      tradeValue:      fill.fillPrice * fill.qty,
      realizedPnl,
      closingTrade:    realizedPnl !== 0,
    },
  });

  return realizedPnl;
}

// ── Execute fill (shared by placeOrder + checkPendingOrders) ──────────────────

async function executeFill(
  walletId:  string,
  order:     PaperOrder,
  ltp:       number,
  volume     = 0,
): Promise<void> {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
  const { fillPrice, slippagePct } = computeSlippage(
    order.ordertype  as Parameters<typeof computeSlippage>[0],
    order.transactiontype as Parameters<typeof computeSlippage>[1],
    ltp,
    volume,
  );

  const orderValue = fillPrice * order.quantity;

  // Check balance for buy
  if (order.transactiontype === "BUY" && wallet.balance < orderValue) {
    await prisma.paperOrder.update({
      where: { id: order.id },
      data:  { status: "REJECTED", rejectionReason: `Insufficient balance (need ₹${orderValue.toFixed(0)})` },
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Settle order
    await tx.paperOrder.update({
      where: { id: order.id },
      data: {
        status:       "FILLED",
        filledQty:    order.quantity,
        avgFillPrice: fillPrice,
        slippagePct,
        filledAt:     new Date(),
      },
    });

    // Net position + write trade — get realized P&L
    const realizedPnl = await netPosition(tx, walletId, {
      tradingsymbol:   order.tradingsymbol,
      symboltoken:     order.symboltoken,
      exchange:        order.exchange,
      producttype:     order.producttype,
      side:            order.transactiontype as "BUY" | "SELL",
      qty:             order.quantity,
      fillPrice,
      slippagePct,
      orderId:         order.id,
    });

    // Update wallet
    if (order.transactiontype === "BUY") {
      await tx.wallet.update({
        where: { id: walletId },
        data:  { balance: { decrement: orderValue }, usedMargin: { increment: orderValue } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId,
          type:         "BUY_DEBIT",
          amount:       -orderValue,
          balanceBefore:wallet.balance,
          balanceAfter: wallet.balance - orderValue,
          description:  `Bought ${order.quantity} ${order.tradingsymbol} @ ₹${fillPrice.toFixed(2)}`,
        },
      });
    } else {
      // SELL: return invested amount + P&L
      const invested = Math.abs(order.quantity * (
        (await tx.position.findFirst({
          where: { walletId, tradingsymbol: order.tradingsymbol, producttype: order.producttype },
        }))?.avgBuyPrice ?? fillPrice
      ));
      const returned = orderValue;
      await tx.wallet.update({
        where: { id: walletId },
        data:  {
          balance:     { increment: returned },
          usedMargin:  { decrement: Math.min(invested, wallet.usedMargin) },
          realizedPnl: { increment: realizedPnl },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId,
          type:         "SELL_CREDIT",
          amount:       returned,
          balanceBefore:wallet.balance,
          balanceAfter: wallet.balance + returned,
          description:  `Sold ${order.quantity} ${order.tradingsymbol} @ ₹${fillPrice.toFixed(2)} | P&L: ${realizedPnl >= 0 ? "+" : ""}₹${realizedPnl.toFixed(2)}`,
        },
      });
    }
  });
}

// ── Place order ───────────────────────────────────────────────────────────────

export async function placeOrder(
  walletId: string,
  req:      PlaceOrderRequest,
  ltp:      number,
  volume    = 0,
): Promise<PaperOrderData> {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });

  // Pre-check balance for MARKET buys immediately
  if (req.transactiontype === "BUY" && req.ordertype === "MARKET") {
    const estimatedCost = ltp * 1.001 * req.quantity; // rough upper bound with slippage
    if (wallet.balance < estimatedCost) {
      const order = await prisma.paperOrder.create({
        data: {
          walletId,
          ...req,
          price:          req.price ?? 0,
          triggerprice:   req.triggerprice ?? 0,
          status:         "REJECTED",
          rejectionReason:`Insufficient balance (need ≈₹${estimatedCost.toFixed(0)}, available ₹${wallet.balance.toFixed(0)})`,
        },
      });
      return orderToData(order);
    }
  }

  // Determine initial status
  const isMarket = req.ordertype === "MARKET" || req.ordertype === "STOPLOSS_MARKET";
  const isLimit  = req.ordertype === "LIMIT";
  const isSL     = req.ordertype === "STOPLOSS_LIMIT" || req.ordertype === "STOPLOSS_MARKET";

  let initialStatus: "OPEN" | "PENDING" = "OPEN";
  if (isLimit || isSL) {
    // Check if immediately fillable
    const canFillNow = isLimit
      ? limitHit(req.transactiontype, req.price, ltp)
      : stopTriggered(req.transactiontype, req.triggerprice, ltp);
    if (!canFillNow) initialStatus = "PENDING";
  }

  const order = await prisma.paperOrder.create({
    data: {
      walletId,
      tradingsymbol:   req.tradingsymbol,
      symboltoken:     req.symboltoken,
      exchange:        req.exchange,
      transactiontype: req.transactiontype,
      ordertype:       req.ordertype,
      producttype:     req.producttype,
      quantity:        req.quantity,
      price:           req.price ?? 0,
      triggerprice:    req.triggerprice ?? 0,
      status:          initialStatus,
      source:          req.source ?? "manual",
      notes:           req.notes,
    },
  });

  // Fill immediately for market orders or immediately-fillable limit orders
  if (isMarket || initialStatus === "OPEN") {
    await executeFill(walletId, order, isMarket ? ltp : req.price, volume);
  }

  const filled = await prisma.paperOrder.findUniqueOrThrow({ where: { id: order.id } });
  return orderToData(filled);
}

// ── Cancel order ──────────────────────────────────────────────────────────────

export async function cancelOrder(
  walletId: string,
  orderId:  string,
): Promise<PaperOrderData> {
  const order = await prisma.paperOrder.findFirstOrThrow({
    where: { id: orderId, walletId, status: "PENDING" },
  });
  const updated = await prisma.paperOrder.update({
    where: { id: order.id },
    data:  { status: "CANCELLED", cancelledAt: new Date() },
  });
  return orderToData(updated);
}

// ── Check pending orders against live LTPs ────────────────────────────────────

export async function checkPendingOrders(
  walletId: string,
  quotes:   Map<string, number>, // symboltoken → ltp
): Promise<void> {
  const pending = await prisma.paperOrder.findMany({
    where: { walletId, status: "PENDING" },
  });

  for (const order of pending) {
    const ltp = quotes.get(order.symboltoken);
    if (!ltp) continue;

    const side = order.transactiontype as "BUY" | "SELL";

    const shouldFill =
      (order.ordertype === "LIMIT" && limitHit(side, order.price, ltp)) ||
      ((order.ordertype === "STOPLOSS_LIMIT" || order.ordertype === "STOPLOSS_MARKET") &&
        stopTriggered(side, order.triggerprice, ltp));

    if (shouldFill) {
      const fillAt = order.ordertype === "STOPLOSS_LIMIT" ? order.price : ltp;
      await prisma.paperOrder.update({
        where: { id: order.id },
        data:  { status: "OPEN" },
      });
      await executeFill(walletId, { ...order, status: "OPEN" }, fillAt);
    }

    // Expire DAY orders after market close (handled by caller; here just return)
  }
}

// ── Positions with live P&L ───────────────────────────────────────────────────

export async function getPositionsWithPnl(
  walletId: string,
  quotes:   Map<string, number>,
): Promise<PositionData[]> {
  const positions = await prisma.position.findMany({
    where: { walletId },
    orderBy: { openedAt: "desc" },
  });

  return positions.map((pos) => {
    const ltp = quotes.get(pos.symboltoken) ?? pos.lastLtp;
    return positionToData(pos, ltp);
  });
}

// ── MIS auto square-off ───────────────────────────────────────────────────────

export async function squareOffMisPositions(
  walletId: string,
  quotes:   Map<string, number>,
): Promise<void> {
  const misPositions = await prisma.position.findMany({
    where: { walletId, producttype: "MIS", netQty: { not: 0 } },
  });

  for (const pos of misPositions) {
    const ltp  = quotes.get(pos.symboltoken) ?? pos.lastLtp;
    const side: "BUY" | "SELL" = pos.netQty > 0 ? "SELL" : "BUY";

    const order = await prisma.paperOrder.create({
      data: {
        walletId,
        tradingsymbol:   pos.tradingsymbol,
        symboltoken:     pos.symboltoken,
        exchange:        pos.exchange,
        transactiontype: side,
        ordertype:       "MARKET",
        producttype:     "MIS",
        quantity:        Math.abs(pos.netQty),
        price:           0,
        triggerprice:    0,
        status:          "OPEN",
        source:          "strategy",
        notes:           "MIS auto square-off",
      },
    });

    await executeFill(walletId, order, ltp);
  }
}

// ── Orders list ───────────────────────────────────────────────────────────────

export async function getOrders(
  walletId: string,
  status?:  string,
): Promise<PaperOrderData[]> {
  const orders = await prisma.paperOrder.findMany({
    where:   { walletId, ...(status ? { status } : {}) },
    orderBy: { placedAt: "desc" },
    take:    200,
  });
  return orders.map(orderToData);
}

// ── Trade journal ─────────────────────────────────────────────────────────────

export async function getTradeJournal(
  walletId: string,
  page      = 1,
  limit     = 50,
): Promise<{ trades: TradeData[]; total: number }> {
  const [trades, total] = await Promise.all([
    prisma.trade.findMany({
      where:   { walletId },
      orderBy: { executedAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.trade.count({ where: { walletId } }),
  ]);

  return {
    trades: trades.map((t) => ({
      ...t,
      notes:      t.notes ?? null,
      executedAt: t.executedAt.toISOString(),
    })),
    total,
  };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getTradingStats(
  walletId:      string,
  unrealizedPnl: number,
): Promise<TradingStats> {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });

  const closingTrades = await prisma.trade.findMany({
    where:  { walletId, closingTrade: true },
    select: { realizedPnl: true },
  });

  const wins   = closingTrades.filter((t) => t.realizedPnl > 0).map((t) => t.realizedPnl);
  const losses = closingTrades.filter((t) => t.realizedPnl < 0).map((t) => t.realizedPnl);
  const avgWin  = wins.length  ? wins.reduce((a, b) => a + b, 0)   / wins.length  : 0;
  const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

  const totalTrades   = await prisma.trade.count({ where: { walletId } });
  const openPositions = await prisma.position.count({ where: { walletId } });
  const totalPnl      = wallet.realizedPnl + unrealizedPnl;
  const totalPnlPct   = wallet.totalDeposited > 0 ? (totalPnl / wallet.totalDeposited) * 100 : 0;
  const profitFactor  = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : avgWin > 0 ? 999 : 0;
  const bestTrade     = wins.length  ? Math.max(...wins)   : 0;
  const worstTrade    = losses.length ? Math.min(...losses) : 0;

  return {
    balance:        wallet.balance,
    usedMargin:     wallet.usedMargin,
    totalDeposited: wallet.totalDeposited,
    realizedPnl:    wallet.realizedPnl,
    unrealizedPnl,
    totalPnl:       Math.round(totalPnl * 100) / 100,
    totalPnlPct:    Math.round(totalPnlPct * 100) / 100,
    openPositions,
    totalTrades,
    winRate:        closingTrades.length > 0 ? Math.round((wins.length / closingTrades.length) * 1000) / 10 : 0,
    avgWin:         Math.round(avgWin * 100) / 100,
    avgLoss:        Math.round(avgLoss * 100) / 100,
    profitFactor:   Math.round(profitFactor * 100) / 100,
    bestTrade:      Math.round(bestTrade * 100) / 100,
    worstTrade:     Math.round(worstTrade * 100) / 100,
  };
}
