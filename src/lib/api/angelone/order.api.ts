/**
 * Angel One SmartAPI — order REST endpoints.
 *
 * All paths use the authenticated `smartApiClient` which automatically
 * injects the JWT and handles 401 → token refresh.
 */

import smartApiClient from "@/lib/api/smartApiClient";
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
  placeOrder:  "/rest/secure/angelbroking/order/v1/placeOrder",
  modifyOrder: "/rest/secure/angelbroking/order/v1/modifyOrder",
  cancelOrder: "/rest/secure/angelbroking/order/v1/cancelOrder",
  orderBook:   "/rest/secure/angelbroking/order/v1/list",
  tradeBook:   "/rest/secure/angelbroking/order/v1/trades",
  positions:   "/rest/secure/angelbroking/portfolio/v1/getPosition",
  orderDetail: (id: string) => `/rest/secure/angelbroking/order/v1/details/${id}`,
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
    const { data } = await smartApiClient.post<AngelApiResponse<AngelOrderPlaced>>(
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
    const { data } = await smartApiClient.post<AngelApiResponse<{ orderid: string }>>(
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
    const { data } = await smartApiClient.post<AngelApiResponse<{ orderid: string }>>(
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
    const { data } = await smartApiClient.get<AngelApiResponse<AngelOrder[] | null>>(
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
    const { data } = await smartApiClient.get<AngelApiResponse<AngelTrade[] | null>>(
      PATHS.tradeBook,
    );
    if (!data.status && data.errorcode !== "AB1006") {
      assertSuccess(data, "getTradeBook");
    }
    return data.data ?? [];
  },

  /**
   * Fetch all open positions (intraday + delivery).
   */
  async getPositions(): Promise<{ net: AngelPosition[]; day: AngelPosition[] }> {
    const { data } = await smartApiClient.get<
      AngelApiResponse<{ net: AngelPosition[] | null; day: AngelPosition[] | null } | null>
    >(PATHS.positions);
    if (!data.status && data.errorcode !== "AB1006") {
      assertSuccess(data, "getPositions");
    }
    return {
      net: data.data?.net ?? [],
      day: data.data?.day ?? [],
    };
  },

  /**
   * Fetch detail for a single order by its uniqueorderid.
   */
  async getOrderDetail(uniqueOrderId: string): Promise<AngelOrder> {
    const { data } = await smartApiClient.get<AngelApiResponse<AngelOrder>>(
      PATHS.orderDetail(uniqueOrderId),
    );
    assertSuccess(data, "getOrderDetail");
    return data.data;
  },
};
