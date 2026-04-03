import { Suspense } from "react";
import { sanityFetch } from "@/sanity/lib/live";

import {
  FEATURED_PRODUCTS_QUERY,
  FILTER_PRODUCTS_BY_NAME_QUERY,
  FILTER_PRODUCTS_BY_PRICE_ASC_QUERY,
  FILTER_PRODUCTS_BY_PRICE_DESC_QUERY,
  FILTER_PRODUCTS_BY_RELEVANCE_QUERY,
} from "@/sanity/queries/products";

import { ALL_CATEGORIES_QUERY } from "@/sanity/queries/categories";
import { FeaturedCarousel } from "@/components/pageUI/FeaturedCarousel";
import { FeaturedCarouselSkeleton } from "@/components/pageUI/FeaturedCarouselSkeleton";
import { ProductSection } from "@/components/pageUI/ProductSection";
import { CategoryTiles } from "@/components/pageUI/CategoryTiles";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    color?: string;
    material?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    inStock?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchQuery = params.q ?? "";
  const categorySlug = params.category ?? "";
  const color = params.color ?? "";
  const material = params.material ?? "";
  const minPrice = Number(params.minPrice) || 0;
  const maxPrice = Number(params.maxPrice) || 0;
  const sort = params.sort ?? "name";
  const inStock = params.inStock === "true";

  // Select query based on sort parameter
  const getQuery = () => {
    // If searching and sort is relevance, use relevance query
    if (searchQuery && sort === "relevance") {
      return FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
    }

    switch (sort) {
      case "price_asc":
        return FILTER_PRODUCTS_BY_PRICE_ASC_QUERY;
      case "price_desc":
        return FILTER_PRODUCTS_BY_PRICE_DESC_QUERY;
      case "relevance":
        return FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
      default:
        return FILTER_PRODUCTS_BY_NAME_QUERY;
    }
  };

  // Fetch products with filters (server-side via GROQ)
  const { data: products } = await sanityFetch({
    query: getQuery(),
    params: {
      searchQuery,
      categorySlug,
      color,
      material,
      minPrice,
      maxPrice,
      inStock,
    },
  });

  // Fetch categories for filter sidebar
  const { data: categories } = await sanityFetch({
    query: ALL_CATEGORIES_QUERY,
  });

  // Fetch featured products for carousel
  const { data: featuredProducts } = await sanityFetch({
    query: FEATURED_PRODUCTS_QUERY,
  });

  const selectedCategory = categories.find(
    (category) => category.slug === categorySlug,
  );
  const pageTitle = selectedCategory
    ? selectedCategory.parentCategory
      ? `${selectedCategory.parentCategory.title} / ${selectedCategory.title}`
      : selectedCategory.title
    : "All Products";

  return (
    <div className="">
      {/* featured product carousel */}
      {featuredProducts.length > 0 && (
        <Suspense fallback={<FeaturedCarouselSkeleton />}>
          <FeaturedCarousel products={featuredProducts} />
        </Suspense>
      )}

      {/* page banner */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Shop {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Quality products for every need
          </p>
        </div>

        {/* category tiles */}
        <div className="mt-6">
          <CategoryTiles
            categories={categories}
            activeCategory={categorySlug || undefined}
          />
        </div>
      </div>


      {/*  Products section*/}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProductSection
          categories={categories}
          products={products}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
