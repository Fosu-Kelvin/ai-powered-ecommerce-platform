"use client";

import Link from "next/link";
import Image from "next/image";
import { Grid2x2 } from "lucide-react";
import type { ALL_CATEGORIES_QUERYResult } from "@/sanity.types";

interface CategoryTilesProps {
  categories: ALL_CATEGORIES_QUERYResult;
  activeCategory?: string;
}

export function CategoryTiles({
  categories,
  activeCategory,
}: CategoryTilesProps) {
  const parentCategories = categories.filter((category) => !category.parentCategory);
  const selectedCategory = categories.find((category) => category.slug === activeCategory);
  const activeParentSlug =
    selectedCategory?.parentCategory?.slug ?? selectedCategory?.slug;
  const activeParentCategory = parentCategories.find(
    (category) => category.slug === activeParentSlug,
  );
  const visibleCategories = activeParentSlug
    ? categories.filter(
        (category) => category.parentCategory?.slug === activeParentSlug,
      )
    : parentCategories;

  return (
    <div className="relative">
      {/* Horizontal scrolling container - full width with edge padding */}
      <div className="flex gap-4 overflow-x-auto  py-4 pl-8 pr-4 sm:pl-12 sm:pr-6 lg:pl-10 lg:pr-8 scrollbar-hide">
        {/* All Products tile */}
        <Link
          href="/"
          className={`group relative flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
            !activeCategory
              ? "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-zinc-900"
              : "hover:ring-2 hover:ring-zinc-300 hover:ring-offset-2 dark:hover:ring-zinc-600 dark:hover:ring-offset-zinc-900"
          }`}
        >
          <div className="relative h-32 w-56 sm:h-56 sm:w-80">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-zinc-700 dark:to-zinc-800" />

            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Grid2x2 className="h-12 w-12 text-white/60 transition-transform duration-300 group-hover:scale-110" />
            </div>

            {/* Dark overlay for text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Category name */}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <span className="text-base font-semibold text-white drop-shadow-md">
                All Products
              </span>
            </div>
          </div>
        </Link>

        {activeParentCategory && (
          <Link
            href={`/?category=${activeParentCategory.slug}`}
            className={`group relative flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
              activeCategory === activeParentCategory.slug
                ? "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-zinc-900"
                : "hover:ring-2 hover:ring-zinc-300 hover:ring-offset-2 dark:hover:ring-zinc-600 dark:hover:ring-offset-zinc-900"
            }`}
          >
            <div className="relative h-32 w-56 sm:h-56 sm:w-80">
              {activeParentCategory.image?.asset?.url ? (
                <Image
                  src={activeParentCategory.image.asset.url}
                  alt={activeParentCategory.title ?? "Parent category"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="block text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                  Parent Category
                </span>
                <span className="mt-1 block text-base font-semibold text-white drop-shadow-md">
                  All {activeParentCategory.title}
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Category tiles */}
        {visibleCategories.map((category) => {
          const isActive = activeCategory === category.slug;
          const imageUrl = category.image?.asset?.url;
          const isChildCategory = Boolean(category.parentCategory);

          return (
            <Link
              key={category._id}
              href={`/?category=${category.slug}`}
              className={`group relative flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${
                isActive
                  ? "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-zinc-900"
                  : "hover:ring-2 hover:ring-zinc-300 hover:ring-offset-2 dark:hover:ring-zinc-600 dark:hover:ring-offset-zinc-900"
              }`}
            >
              <div className="relative h-32 w-56 sm:h-56 sm:w-80">
                {/* Background image or gradient fallback */}
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={category.title ?? "Category"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600" />
                )}

                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/80" />

                {/* Category name */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  {isChildCategory && (
                    <span className="block text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                      {category.parentCategory?.title}
                    </span>
                  )}
                  <span className="text-base font-semibold text-white drop-shadow-md">
                    {category.title}
                  </span>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <span className="flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
