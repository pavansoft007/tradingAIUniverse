/**
 * Angel One SmartAPI — order REST endpoints.
 *
 * All paths use the authenticated `orderProxyClient` which automatically
 * injects the JWT and handles 401 → token refresh.
 */

import orderProxyClient from "@/lib/api/orderProxyClient";
import type {
  AngelApiResponse,
  AngelCancelOrderRequest,
  AngelModifyOrderRequest,
  AngelOrder,
  AngelOrderPlaced,
  AngelPlaceOrderRequest,
  AngelPosition,
  AngelTrade,
} from "@/types/angel-order.types";

const PATHS = {
  placeOrder:      "/rest/secure/angelbroking/order/v1/placeOrder",
  modifyOrder:     "/rest/secure/angelbroking/order/v1/modifyOrder",
  cancelOrder:     "/rest/secure/angelbroking/order/v1/cancelOrder",
  orderBook:       "/rest/secure/angelbroking/order/v1/list",
  tradeBook:       "/rest/secure/angelbroking/order/v1/trades",
  // Correct Angel One position endpoint (NOT /portfolio/v1/getPosition)
  positions:       "/rest/secure/angelbroking/order/v1/getPosition",
  convertPosition: "/rest/secure/angelbroking/order/v1/convertPosition",
  orderDetail:     (id: string) => `/rest/secure/angelbroking/order/v1/details/${id}`,
} as const;

/** Throw a descriptive error when the Angel One `status: false` envelope is returned. */
function assertSuccess<T>(res: AngelApiResponse<T>, context: string): void {
  if (!res.status) {
    const err = new Error(`${context}: ${res.message || "Unknown error"}`) as Error & {
      errorcode: string;
      angelError: true;
    };
    err.errorcode  = res.errorcode;
    err.angelError = true;
    throw err;
  }
}

export const orderApi = {
  /**
   * Place a new order.
   * Returns the assigned orderid and uniqueorderid.
   */
  async placeOrder(payload: AngelPlaceOrderRequest): Promise<AngelOrderPlaced> {
    const { data } = await orderProxyClient.post<AngelApiResponse<AngelOrderPlaced>>(
      PATHS.placeOrder,
      payload,
    );
    assertSuccess(data, "placeOrder");
    return data.data;
  },

  /**
   * Modify an open or pending order.
   */
  async modifyOrder(payload: AngelModifyOrderRequest): Promise<{ orderid: string }> {
    const { data } = await orderProxyClient.post<AngelApiResponse<{ orderid: string }>>(
      PATHS.modifyOrder,
      payload,
    );
    assertSuccess(data, "modifyOrder");
    return data.data;
  },

  /**
   * Cancel an open or pending order.
   */
  async cancelOrder(payload: AngelCancelOrderRequest): Promise<{ orderid: string }> {
    const { data } = await orderProxyClient.post<AngelApiResponse<{ orderid: string }>>(
      PATHS.cancelOrder,
      payload,
    );
    assertSuccess(data, "cancelOrder");
    return data.data;
  },

  /**
   * Fetch today's complete order book.
   */
  async getOrderBook(): Promise<AngelOrder[]> {
    const { data } = await orderProxyClient.get<AngelApiResponse<AngelOrder[] | null>>(
      PATHS.orderBook,
    );
    // Angel One returns status: true with data: null when no orders exist
    if (!data.status && data.errorcode !== "AB1006") {
      assertSuccess(data, "getOrderBook");
    }
    return data.data ?? [];
  },

  /**
   * Fetch today's executed trades.
   */
  async getTradeBook(): Promise<AngelTrade[]> {
    const { data } = await orderProxyClient.get<AngelApiResponse<AngelTrade[] | null>>(
      PATHS.tradeBook,
    );
    if (!data.status && data.errorcode !== "AB1006") {
      assertSuccess(data, "getTradeBook");
    }
    return data.data ?? [];
  },

  /**
   * Fetch all open positions (intraday + F&O).
   * Angel One GET /order/v1/getPosition returns a flat array.
   */
  async getPositions(): Promise<AngelPosition[]> {
    const { data } = await orderProxyClient.get<
      AngelApiResponse<AngelPosition[] | null>
    >(PATHS.positions);
    if (!data.status && data.errorcode !== "AB1006") {
      assertSuccess(data, "getPositions");
    }
    return data.data ?? [];
  },

  /**
   * Convert a position from one product type to another
   * (e.g. INTRADAY → DELIVERY before market close).
   */
  async convertPosition(payload: {
    exchange:       string;
    symboltoken:    string;
    tradingsymbol:  string;
    transactiontype:"BUY" | "SELL";
    oldproducttype: string;
    newproducttype: string;
    quantity:       number;
  }): Promise<boolean> {
    const { data } = await orderProxyClient.post<AngelApiResponse<boolean | null>>(
      PATHS.convertPosition,
      payload,
    );
    assertSuccess(data, "convertPosition");
    return data.data ?? true;
  },

  /**
   * Fetch detail for a single order by its uniqueorderid.
   */
  async getOrderDetail(uniqueOrderId: string): Promise<AngelOrder> {
    const { data } = await orderProxyClient.get<AngelApiResponse<AngelOrder>>(
      PATHS.orderDetail(uniqueOrderId),
    );
    assertSuccess(data, "getOrderDetail");
    return data.data;
  },
};
