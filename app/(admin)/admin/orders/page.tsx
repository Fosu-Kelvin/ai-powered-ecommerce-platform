import Link from "next/link";
import { ShoppingCart, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { OrderTableHeader } from "@/components/admin";
import { ORDER_STATUS_TABS, getOrderStatus } from "@/lib/constants/orderStatus";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/utils";
import { client } from "@/sanity/lib/client";
import { ADMIN_ORDERS_QUERY } from "@/sanity/queries/admin";

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
}

interface AdminOrder {
  _id: string;
  orderNumber: string | null;
  email: string | null;
  total: number | null;
  status: string | null;
  createdAt: string | null;
  itemCount: number;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const requestedStatus = params.status ?? "all";
  const currentTab = ORDER_STATUS_TABS.some(
    (tab) => tab.value === requestedStatus,
  )
    ? requestedStatus
    : "all";
  const searchQuery = params.q?.trim() ?? "";

  const orders = await client.fetch<AdminOrder[]>(ADMIN_ORDERS_QUERY, {
    status: currentTab,
    searchPattern: searchQuery ? `*${searchQuery}*` : "",
  });

  const description = searchQuery
    ? "Try adjusting your search terms."
    : currentTab === "all"
      ? "Orders will appear here when customers make purchases."
      : `No ${currentTab} orders at the moment.`;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Orders
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Manage and track customer orders
          </p>
        </div>
        <Link
          href="/studio"
          target="_blank"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ExternalLink className="h-4 w-4" />
          Open Studio
        </Link>
      </div>

      <form className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
        <Input
          name="q"
          defaultValue={searchQuery}
          placeholder="Search by order # or email..."
          className="w-full sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {ORDER_STATUS_TABS.map((tab) => {
            const isActive = tab.value === currentTab;
            const href =
              tab.value === "all"
                ? searchQuery
                  ? `/admin/orders?q=${encodeURIComponent(searchQuery)}`
                  : "/admin/orders"
                : `/admin/orders?status=${encodeURIComponent(tab.value)}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`;

            return (
              <Link
                key={tab.value}
                href={href}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </form>

      {orders.length ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <Table>
            <OrderTableHeader />
            <TableBody>
              {orders.map((order) => {
                const status = getOrderStatus(order.status);
                const StatusIcon = status.icon;

                return (
                  <TableRow key={order._id}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="block"
                      >
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          #{formatOrderNumber(order.orderNumber)}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 sm:hidden">
                          {order.email ?? "No email"}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="block"
                      >
                        <div className="max-w-[220px] truncate text-sm text-zinc-700 dark:text-zinc-300">
                          {order.email ?? "No email"}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-center md:table-cell">
                      {order.itemCount}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${status.color} inline-flex items-center gap-1`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(order.createdAt, "short", "Unknown")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={ShoppingCart}
          title="No orders found"
          description={description}
        />
      )}
    </div>
  );
}
