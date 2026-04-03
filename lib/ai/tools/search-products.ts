import { tool } from "ai";
import { z } from "zod";
import { sanityFetch } from "@/sanity/lib/live";
import { AI_SEARCH_PRODUCTS_QUERY } from "@/sanity/queries/products";
import { formatPrice } from "@/lib/utils";
import { getStockStatus, getStockMessage } from "@/lib/constants/stock";
import { MATERIAL_VALUES, COLOR_VALUES } from "@/lib/constants/filters";
import { getCategoryFilterConfig } from "@/lib/constants/category-attributes";
import type { AI_SEARCH_PRODUCTS_QUERYResult } from "@/sanity.types";
import type { SearchProduct } from "@/lib/ai/types";

const MATERIAL_SET = new Set<string>(MATERIAL_VALUES);
const COLOR_SET = new Set<string>(COLOR_VALUES);

const productSearchSchema = z.object({
  query: z
    .string()
    .optional()
    .default("")
    .describe(
      "Search term to find products by name, description, or category (e.g., 'laptop', 'backpack', 'skincare')"
    ),
  category: z
    .string()
    .optional()
    .default("")
    .describe(
      "Filter by category slug (e.g., 'electronics', 'fashion', 'beauty', 'home')"
    ),
  material: z
    .string()
    .optional()
    .describe("Filter by material type"),
  color: z
    .string()
    .optional()
    .describe("Filter by color"),
  minPrice: z
    .number()
    .optional()
    .default(0)
    .describe("Minimum price in GHS (e.g., 100)"),
  maxPrice: z
    .number()
    .optional()
    .default(0)
    .describe("Maximum price in GHS (e.g., 500). Use 0 for no maximum."),
});

export const searchProductsTool = tool({
  description:
    "Search for products in The UDS Shop. Can search by name, description, or category, and filter by color, price, and category-specific fields like material where relevant.",
  parameters: productSearchSchema,
  execute: async ({ query, category, material, color, minPrice, maxPrice }) => {
    const filterConfig = getCategoryFilterConfig(category || null);
    const normalizedMaterial = material?.trim().toLowerCase();
    const normalizedColor = color?.trim().toLowerCase();
    const safeMaterial =
      filterConfig.supportsMaterial &&
      normalizedMaterial &&
      MATERIAL_SET.has(normalizedMaterial)
        ? normalizedMaterial
        : "";
    const safeColor =
      filterConfig.supportsColor &&
      normalizedColor &&
      COLOR_SET.has(normalizedColor)
        ? normalizedColor
        : "";

    console.log("[SearchProducts] Query received:", {
      query,
      category,
      material: safeMaterial,
      color: safeColor,
      minPrice,
      maxPrice,
    });

    try {
      const { data: products } = await sanityFetch({
        query: AI_SEARCH_PRODUCTS_QUERY,
        params: {
          searchQuery: query || "",
          categorySlug: category || "",
          material: safeMaterial,
          color: safeColor,
          minPrice: minPrice || 0,
          maxPrice: maxPrice || 0,
        },
      });

      if (products.length === 0) {
        return {
          found: false,
          message: "No products found matching your criteria.",
          products: [],
        };
      }

      const formattedProducts: SearchProduct[] = (
        products as AI_SEARCH_PRODUCTS_QUERYResult
      ).map((product) => ({
        id: product._id,
        name: product.name ?? null,
        slug: product.slug ?? null,
        description: product.description ?? null,
        price: product.price ?? null,
        priceFormatted: product.price ? formatPrice(product.price) : null,
        category: product.category?.title ?? null,
        categorySlug: product.category?.slug ?? null,
        material: product.material ?? null,
        color: product.color ?? null,
        dimensions: product.dimensions ?? null,
        stockCount: product.stock ?? 0,
        stockStatus: getStockStatus(product.stock),
        stockMessage: getStockMessage(product.stock),
        featured: product.featured ?? false,
        assemblyRequired: product.assemblyRequired ?? false,
        customAttributes: (product as any).customAttributes?.filter(
          (attribute: any) => attribute?.name && attribute?.value
        ) ?? [],
        imageUrl: product.image?.asset?.url ?? null,
        productUrl: product.slug ? `/products/${product.slug}` : null,
      }));

      return {
        found: true,
        message: `Found ${products.length} product(s) at The UDS Shop.`,
        products: formattedProducts,
      };
    } catch (error) {
      console.error("[SearchProducts] Error:", error);
      return {
        found: false,
        message: "An error occurred while searching for products.",
        products: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
