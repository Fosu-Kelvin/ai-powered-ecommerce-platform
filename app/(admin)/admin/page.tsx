import Link from "next/link";
import { Package, ShoppingCart, TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StatCard,
  LowStockAlert,
  RecentOrders,
  AIInsightsCard,
} from "@/components/admin";
import { client } from "@/sanity/lib/client";
import { ADMIN_DASHBOARD_STATS_QUERY } from "@/sanity/queries/admin";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants/stock";

interface DashboardStats {
  productCount: number;
  orderCount: number;
  lowStockCount: number;
}

export default async function AdminDashboard() {
  const stats = await client.fetch<DashboardStats>(
    ADMIN_DASHBOARD_STATS_QUERY,
    {
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    },
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Overview of your store
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/studio" target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Studio
          </Link>
        </Button>
      </div>

      <AIInsightsCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Products"
          icon={Package}
          value={stats.productCount}
          href="/admin/inventory"
        />
        <StatCard
          title="Total Orders"
          icon={ShoppingCart}
          value={stats.orderCount}
          href="/admin/orders"
        />
        <StatCard
          title="Low Stock Items"
          icon={TrendingUp}
          value={stats.lowStockCount}
          href="/admin/inventory?filter=low-stock"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LowStockAlert />
        <RecentOrders />
      </div>
    </div>
  );
}
