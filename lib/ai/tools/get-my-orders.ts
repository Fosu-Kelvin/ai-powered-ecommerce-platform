import { tool } from "ai";
import { z } from "zod";
import { sanityFetch } from "@/sanity/lib/live";
import { ORDERS_BY_USER_QUERY } from "@/sanity/queries/orders";
import {
  ORDER_STATUS_VALUES,
  getOrderStatusEmoji,
} from "@/lib/constants/orderStatus";
import { formatPrice } from "@/lib/utils";
import type { ORDERS_BY_USER_QUERYResult } from "@/sanity.types";

const ORDER_STATUS_SET = new Set<string>(ORDER_STATUS_VALUES);

// 1. Updated Schema: Removed the empty string "" to satisfy Gemini
const getMyOrdersSchema = z.object({
  status: z
    .string()
    .optional()
    .describe("Filter orders by status (e.g., 'pending', 'paid'). Skip this to see all orders."),
});

export interface OrderSummary {
  id: string;
  orderNumber: string | null;
  total: number | null;
  totalFormatted: string | null;
  status: string | null;
  statusDisplay: string;
  itemCount: number;
  itemNames: string[];
  itemImages: string[];
  createdAt: string | null;
  orderUrl: string;
}

export interface GetMyOrdersResult {
  found: boolean;
  message: string;
  orders: OrderSummary[];
  totalOrders: number;
  isAuthenticated: boolean;
}

export function createGetMyOrdersTool(userId: string | null) {
  if (!userId) {
    return null;
  }

  return tool({
    description: "Get the current user's orders from The UDS Shop. Can optionally filter by order status.",
    parameters: getMyOrdersSchema,
    execute: async ({ status }) => {
      const normalizedStatus = status?.trim().toLowerCase();
      const safeStatus =
        normalizedStatus && ORDER_STATUS_SET.has(normalizedStatus)
          ? normalizedStatus
          : undefined;

      console.log("[GetMyOrders] Fetching orders for user:", userId, {
        status: safeStatus,
      });

      try {
        const { data: orders } = await sanityFetch({
          query: ORDERS_BY_USER_QUERY,
          params: { clerkUserId: userId },
        });

        // 2. Logic Update: Only filter if Gemini actually provides a status
        let filteredOrders = orders as ORDERS_BY_USER_QUERYResult;
        if (safeStatus) {
          filteredOrders = filteredOrders.filter(
            (order) => order.status === safeStatus
          );
        }

        if (filteredOrders.length === 0) {
          return {
            found: false,
            message: safeStatus
              ? `No orders found with status "${safeStatus}".`
              : "You don't have any orders yet.",
            orders: [],
            totalOrders: 0,
            isAuthenticated: true,
          } satisfies GetMyOrdersResult;
        }

        const formattedOrders: OrderSummary[] = filteredOrders.map((order) => {
          const itemNames =
            (order.itemNames as Array<string | null> | null) ?? [];
          const itemImages =
            (order.itemImages as Array<string | null> | null) ?? [];

          return {
            id: order._id,
            orderNumber: order.orderNumber,
            total: order.total,
            totalFormatted: order.total ? formatPrice(order.total) : null,
            status: order.status,
            statusDisplay: getOrderStatusEmoji(order.status),
            itemCount: order.itemCount ?? 0,
            itemNames: itemNames.flatMap((name) =>
              typeof name === "string" && name.length > 0 ? [name] : []
            ),
            itemImages: itemImages.flatMap((url) =>
              typeof url === "string" && url.length > 0 ? [url] : []
            ),
            createdAt: order.createdAt,
            orderUrl: `/orders/${order._id}`,
          };
        });

        return {
          found: true,
          message: `Found ${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"}.`,
          orders: formattedOrders,
          totalOrders: filteredOrders.length,
          isAuthenticated: true,
        } satisfies GetMyOrdersResult;
      } catch (error) {
        console.error("[GetMyOrders] Error:", error);
        return {
          found: false,
          message: "An error occurred while fetching your orders.",
          orders: [],
          totalOrders: 0,
          isAuthenticated: true,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  });
}
