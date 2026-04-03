import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { client } from "@/sanity/lib/client";
import { isAdminUser } from "@/lib/auth/admin";
import {
  ORDERS_LAST_7_DAYS_QUERY,
  ORDER_STATUS_DISTRIBUTION_QUERY,
  TOP_SELLING_PRODUCTS_QUERY,
  PRODUCTS_INVENTORY_QUERY,
  UNFULFILLED_ORDERS_QUERY,
  REVENUE_BY_PERIOD_QUERY,
} from "@/sanity/queries/stats";

const GOOGLE_MODEL =
  process.env.GOOGLE_GENERATIVE_AI_ADMIN_MODEL ??
  process.env.GOOGLE_GENERATIVE_AI_MODEL ??
  "gemini-2.5-flash";

// --- Interfaces for Type Safety ---
interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

interface StatusDistribution {
  paid: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

interface Product {
  _id: string;
  name: string;
  stock: number;
  category: string;
}

interface ProductSale {
  productName: string;
  quantity: number;
}

type Trend = "up" | "down" | "stable";

interface InsightsPayload {
  salesTrends: {
    summary: string;
    highlights: string[];
    trend: Trend;
  };
  inventory: {
    summary: string;
    alerts: string[];
    recommendations: string[];
  };
  actionItems: {
    urgent: string[];
    recommended: string[];
    opportunities: string[];
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item)))
    .filter((item) => item.length > 0);
}

function asTrend(value: unknown): Trend {
  return value === "up" || value === "down" || value === "stable"
    ? value
    : "stable";
}

function normalizeInsights(raw: unknown): InsightsPayload {
  const root = asRecord(raw);
  const salesTrends = asRecord(root.salesTrends);
  const inventory = asRecord(root.inventory);
  const actionItems = asRecord(root.actionItems);

  return {
    salesTrends: {
      summary: asString(salesTrends.summary, "No summary available."),
      highlights: asStringArray(salesTrends.highlights),
      trend: asTrend(salesTrends.trend),
    },
    inventory: {
      summary: asString(inventory.summary, "No summary available."),
      alerts: asStringArray(inventory.alerts),
      recommendations: asStringArray(inventory.recommendations),
    },
    actionItems: {
      urgent: asStringArray(actionItems.urgent),
      recommended: asStringArray(actionItems.recommended),
      opportunities: asStringArray(actionItems.opportunities),
    },
  };
}

export const revalidate = 3600; // Refresh once per hour

export async function GET() {
  const isAdmin = await isAdminUser();
  if (!isAdmin) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Fetch data from Sanity
    const [
      recentOrders,
      statusDistribution,
      productSales,
      productsInventory,
      unfulfilledOrders,
      revenuePeriod,
    ] = await Promise.all([
      client.fetch<Order[]>(ORDERS_LAST_7_DAYS_QUERY, { 
        startDate: sevenDaysAgo.toISOString() 
      }),
      client.fetch<StatusDistribution>(ORDER_STATUS_DISTRIBUTION_QUERY),
      client.fetch<ProductSale[]>(TOP_SELLING_PRODUCTS_QUERY),
      client.fetch<Product[]>(PRODUCTS_INVENTORY_QUERY),
      client.fetch<any[]>(UNFULFILLED_ORDERS_QUERY),
      client.fetch<any>(REVENUE_BY_PERIOD_QUERY, {
        currentStart: sevenDaysAgo.toISOString(),
        previousStart: fourteenDaysAgo.toISOString(),
      }),
    ]);

    // 2. Aggregate Data Summary
    const dataSummary = {
      sales: {
        totalRevenueGHS: revenuePeriod?.currentPeriod || 0,
        revenueChangePercent: (((revenuePeriod?.currentPeriod - revenuePeriod?.previousPeriod) / (revenuePeriod?.previousPeriod || 1)) * 100).toFixed(1),
        recentOrderCount: recentOrders.length,
        topSellingItems: productSales.slice(0, 5).map(p => `${p.productName} (${p.quantity} sold)`),
      },
      inventory: {
        lowStockItems: productsInventory
          .filter(p => p.stock <= 5)
          .map(p => ({ name: p.name, stock: p.stock })),
        totalCatalogSize: productsInventory.length,
      },
      operations: {
        statusDistribution,
        pendingFulfillment: unfulfilledOrders.length,
      }
    };

    try {
      // 3. Generate Structured AI Insights
      const { object: rawInsights } = await generateObject({
        model: google(GOOGLE_MODEL),
        mode: "json",
        output: "no-schema",
        system: `You are an expert e-commerce analyst for "The UDS Shop", an online marketplace for the UDS community in Ghana. 
                 Analyze the data provided and generate actionable insights for the store administrator. 
                 Always reference prices in GHS (GH₵).`,
        prompt: `Analyze the following store data and generate the dashboard insights.
                 Return JSON only with this exact top-level shape:
                 {
                   "salesTrends": { "summary": string, "highlights": string[], "trend": "up" | "down" | "stable" },
                   "inventory": { "summary": string, "alerts": string[], "recommendations": string[] },
                   "actionItems": { "urgent": string[], "recommended": string[], "opportunities": string[] }
                 }
                 ${JSON.stringify(dataSummary, null, 2)}`,
      });
      const insights = normalizeInsights(rawInsights);

      return Response.json({
  success: true,
  fallbackUsed: false,
  model: GOOGLE_MODEL,
  insights,
  generatedAt: new Date().toISOString(),
  // 🚀 Add this back so the dashboard doesn't crash
  rawMetrics: {
    currentRevenue: dataSummary.sales.totalRevenueGHS,
    orderCount: dataSummary.sales.recentOrderCount,
    lowStockCount: dataSummary.inventory.lowStockItems.length,
    unfulfilledCount: dataSummary.operations.pendingFulfillment,
  }
});

    } catch (aiError: any) {
      const aiErrorMessage =
        aiError?.responseBody ||
        aiError?.message ||
        "Unknown AI error";
      console.warn(
        "⚠️ AI Quota Exceeded or API Error. Using Fallback Mock Data.",
        aiErrorMessage
      );

      // 🚀 MOCK DATA FALLBACK for your presentation
      const mockInsights = {
        salesTrends: {
          summary: "Sales have remained steady across UDS campuses this week, led by strong demand in top product categories.",
          highlights: [
            "12% increase in revenue compared to last week.",
            "Higher conversion on competitively priced products.",
            "Wa campus showing the highest overall product demand."
          ],
          trend: "up"
        },
        inventory: {
          summary: "Inventory is healthy overall, though a few popular products are reaching critical levels.",
          alerts: ["A top-selling product has fewer than 5 units left.", "One high-demand item is currently out of stock."],
          recommendations: ["Restock low-stock best sellers immediately.", "Consider a promo for slower-moving categories."]
        },
        actionItems: {
          urgent: ["Fulfill 5 pending orders from Tamale campus.", "Update stock counts for low-inventory items."],
          recommended: ["Schedule a restock for mid-semester peak.", "Review shipping partners for faster Wa delivery."],
          opportunities: ["Launch a 'Back-to-School' bundle for new students.", "Introduce category-specific promotions for repeat buyers."]
        }
      };

      return Response.json({
  success: true,
  fallbackUsed: true,
  model: GOOGLE_MODEL,
  aiError: String(aiErrorMessage),
  insights: mockInsights,
  generatedAt: new Date().toISOString(),
  // 🚀 Add this back for the fallback too
  rawMetrics: {
    currentRevenue: 0, 
    orderCount: 0,
    lowStockCount: 0,
    unfulfilledCount: 0,
  }
});
    }

  } catch (error: any) {
    console.error("Critical Admin Insights Error:", error);
    return Response.json(
      { success: false, error: "Critical failure in dashboard statistics." },
      { status: 500 }
    );
  }
}
