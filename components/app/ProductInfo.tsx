import Link from "next/link";
import { AddToCartButton } from "@/components/app/AddToCartButton";
import { AskAISimilarButton } from "@/components/app/AskAISimilarButton";
import { StockBadge } from "@/components/app/StockBadge";
import { formatPrice } from "@/lib/utils";
import type { PRODUCT_BY_SLUG_QUERYResult } from "@/sanity.types";

interface ProductInfoProps {
  product: NonNullable<PRODUCT_BY_SLUG_QUERYResult>;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const imageUrl = product.images?.[0]?.asset?.url;
  const customAttributes = ((product as any).customAttributes ?? []) as Array<{
    name?: string | null;
    value?: string | null;
  }>;
  const reservedAttributeNames = new Set([
    "material",
    "color",
    "dimensions",
    "assembly",
    "assembly required",
  ]);
  const normalizedCustomAttributes = customAttributes
    .map((attribute) => ({
      name: attribute.name?.trim() ?? "",
      value: attribute.value?.trim() ?? "",
    }))
    .filter(
      (attribute) =>
        attribute.name.length > 0 &&
        attribute.value.length > 0 &&
        !reservedAttributeNames.has(attribute.name.toLowerCase())
    );

  return (
    <div className="flex flex-col">
      {/* Category */}
      {product.category && (
        <Link
          href={`/?category=${product.category.slug}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {product.category.title}
        </Link>
      )}

      {/* Title */}
      <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        {product.name}
      </h1>

      {/* Price */}
      <p className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {formatPrice(product.price)}
      </p>

      {/* Description */}
      {product.description && (
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          {product.description}
        </p>
      )}

      {/* Stock & Add to Cart */}
      <div className="mt-6 flex flex-col gap-3">
        <StockBadge productId={product._id} stock={product.stock ?? 0} />
        <AddToCartButton
          productId={product._id}
          name={product.name ?? "Unknown Product"}
          price={product.price ?? 0}
          image={imageUrl ?? undefined}
          stock={product.stock ?? 0}
        />
        <AskAISimilarButton
          productName={product.name ?? "this product"}
          categoryName={product.category?.title ?? null}
        />
      </div>

      {/* Metadata */}
      <div className="mt-6 space-y-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        {product.material && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Material</span>
            <span className="font-medium capitalize text-zinc-900 dark:text-zinc-100">
              {product.material}
            </span>
          </div>
        )}
        {product.color && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Color</span>
            <span className="font-medium capitalize text-zinc-900 dark:text-zinc-100">
              {product.color}
            </span>
          </div>
        )}
        {product.dimensions && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Dimensions</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {product.dimensions}
            </span>
          </div>
        )}
        {product.assemblyRequired !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Assembly</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {product.assemblyRequired ? "Required" : "Not required"}
            </span>
          </div>
        )}
        {normalizedCustomAttributes.map((attribute) => (
          <div key={`${attribute.name}:${attribute.value}`} className="flex justify-between gap-3 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">{attribute.name}</span>
            <span className="font-medium text-right text-zinc-900 dark:text-zinc-100">
              {attribute.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
