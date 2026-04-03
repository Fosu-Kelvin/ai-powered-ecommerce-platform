import { notFound } from "next/navigation";
import { ProductDetailEditor } from "@/components/admin/ProductDetailEditor";
import { client } from "@/sanity/lib/client";
import { ADMIN_PRODUCT_DETAIL_QUERY } from "@/sanity/queries/admin";
import { ALL_CATEGORIES_QUERY } from "@/sanity/queries/categories";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

interface ProductDetail {
  _id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  price: number | null;
  stock: number | null;
  featured: boolean | null;
  assemblyRequired: boolean | null;
  material: string | null;
  color: string | null;
  dimensions: string | null;
  customAttributes: Array<{
    _key?: string;
    name?: string;
    value?: string;
  }> | null;
  imageUrls: Array<string | null> | null;
  category: {
    _id: string | null;
    title: string | null;
    slug: string | null;
  } | null;
}

interface CategoryOption {
  _id: string;
  title: string | null;
}

export default async function InventoryDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    client.fetch<ProductDetail | null>(ADMIN_PRODUCT_DETAIL_QUERY, { id }),
    client.fetch<CategoryOption[]>(ALL_CATEGORIES_QUERY),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailEditor initialProduct={product} categories={categories} />
  );
}
