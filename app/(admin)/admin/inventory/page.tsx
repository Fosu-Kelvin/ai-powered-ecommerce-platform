import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ProductTableHeader } from "@/components/admin";
import { client } from "@/sanity/lib/client";
import { ADMIN_PRODUCTS_QUERY } from "@/sanity/queries/admin";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants/stock";
import { formatPrice } from "@/lib/utils";

interface InventoryPageProps {
  searchParams: Promise<{
    q?: string;
    filter?: string;
  }>;
}

interface AdminProduct {
  _id: string;
  name: string | null;
  price: number | null;
  stock: number | null;
  featured: boolean | null;
  slug: string | null;
  imageUrl: string | null;
}

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const params = await searchParams;
  const searchQuery = params.q?.trim() ?? "";
  const inventoryFilter = params.filter === "low-stock" ? "low-stock" : "all";

  const products = await client.fetch<AdminProduct[]>(ADMIN_PRODUCTS_QUERY, {
    searchPattern: searchQuery ? `*${searchQuery}*` : "",
    inventoryFilter,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            Manage your product stock and pricing
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
          placeholder="Search products..."
          className="w-full sm:max-w-sm"
        />
        <div className="flex gap-2">
          <Link
            href={
              searchQuery
                ? `/admin/inventory?q=${encodeURIComponent(searchQuery)}`
                : "/admin/inventory"
            }
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              inventoryFilter === "all"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            All
          </Link>
          <Link
            href={`/admin/inventory?filter=low-stock${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              inventoryFilter === "low-stock"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            Low Stock
          </Link>
        </div>
      </form>

      {products.length ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <Table>
            <ProductTableHeader />
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="hidden sm:table-cell">
                    <div className="relative h-12 w-12 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name ?? "Product"}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/inventory/${product._id}`}
                      className="block"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {product.name ?? "Untitled product"}
                      </div>
                      {product.slug ? (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          /products/{product.slug}
                        </div>
                      ) : null}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatPrice(product.price)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant={
                        (product.stock ?? 0) <= LOW_STOCK_THRESHOLD
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {product.stock ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {product.featured ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/inventory/${product._id}`}
                        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        View
                      </Link>
                      <Link
                        href={`/studio/structure/product;${product._id}`}
                        target="_blank"
                        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        Studio
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={
            searchQuery || inventoryFilter === "low-stock"
              ? "No products found"
              : "No products yet"
          }
          description={
            searchQuery || inventoryFilter === "low-stock"
              ? "Try adjusting your search terms."
              : "Add products in Sanity Studio to populate your catalog."
          }
        />
      )}
    </div>
  );
}
