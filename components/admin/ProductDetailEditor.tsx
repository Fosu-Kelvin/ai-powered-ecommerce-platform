"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants/stock";
import { formatPrice } from "@/lib/utils";
import { COLORS, MATERIALS } from "@/lib/constants/filters";

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

export function ProductDetailEditor({
  initialProduct,
  categories,
}: {
  initialProduct: ProductDetail;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialProduct.name ?? "",
    slug: initialProduct.slug ?? "",
    description: initialProduct.description ?? "",
    price: String(initialProduct.price ?? 0),
    stock: String(initialProduct.stock ?? 0),
    featured: Boolean(initialProduct.featured),
    assemblyRequired: Boolean(initialProduct.assemblyRequired),
    material: initialProduct.material ?? "",
    color: initialProduct.color ?? "",
    dimensions: initialProduct.dimensions ?? "",
    categoryId: initialProduct.category?._id ?? "",
  });
  const [customAttributes, setCustomAttributes] = useState(
    initialProduct.customAttributes?.length
      ? initialProduct.customAttributes.map((attribute) => ({
          _key: attribute._key ?? crypto.randomUUID(),
          name: attribute.name ?? "",
          value: attribute.value ?? "",
        }))
      : [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const images = (initialProduct.imageUrls ?? []).filter(
    (imageUrl): imageUrl is string => Boolean(imageUrl),
  );
  const stock = Number(form.stock || 0);

  const setField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const updateAttribute = (
    index: number,
    field: "name" | "value",
    value: string,
  ) => {
    setCustomAttributes((current) =>
      current.map((attribute, currentIndex) =>
        currentIndex === index ? { ...attribute, [field]: value } : attribute,
      ),
    );
    setSaved(false);
  };

  const addAttribute = () => {
    setCustomAttributes((current) => [
      ...current,
      { _key: crypto.randomUUID(), name: "", value: "" },
    ]);
    setSaved(false);
  };

  const removeAttribute = (index: number) => {
    setCustomAttributes((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaved(false);

    const response = await fetch(`/api/admin/products/${initialProduct._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: Number(form.price || 0),
        stock: Number(form.stock || 0),
        customAttributes,
      }),
    });

    const result = (await response.json()) as { error?: string };

    setIsSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Failed to save product changes.");
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {form.name || "Untitled product"}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Edit core product details here. Use Studio for media-heavy
              changes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved ? (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              Saved
            </span>
          ) : null}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Product Overview
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="product-name">Name</Label>
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-slug">Slug</Label>
                <Input
                  id="product-slug"
                  value={form.slug}
                  onChange={(event) => setField("slug", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-category">Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => setField("categoryId", value)}
                >
                  <SelectTrigger id="product-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.title ?? "Untitled category"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  value={form.description}
                  onChange={(event) =>
                    setField("description", event.target.value)
                  }
                  rows={5}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-price">Price</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(event) => setField("price", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-stock">Stock</Label>
                <Input
                  id="product-stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) => setField("stock", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-material">Material</Label>
                <Select
                  value={form.material || "__empty__"}
                  onValueChange={(value) =>
                    setField("material", value === "__empty__" ? "" : value)
                  }
                >
                  <SelectTrigger id="product-material">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">No material</SelectItem>
                    {MATERIALS.map((material) => (
                      <SelectItem key={material.value} value={material.value}>
                        {material.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-color">Color</Label>
                <Select
                  value={form.color || "__empty__"}
                  onValueChange={(value) =>
                    setField("color", value === "__empty__" ? "" : value)
                  }
                >
                  <SelectTrigger id="product-color">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">No color</SelectItem>
                    {COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        {color.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="product-dimensions">Dimensions</Label>
                <Input
                  id="product-dimensions"
                  value={form.dimensions}
                  onChange={(event) =>
                    setField("dimensions", event.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Custom Attributes
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAttribute}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {customAttributes.length ? (
                customAttributes.map((attribute, index) => (
                  <div
                    key={attribute._key}
                    className="grid gap-2 rounded-lg border border-zinc-200 p-3 sm:grid-cols-[1fr_1fr_auto] dark:border-zinc-800"
                  >
                    <Input
                      value={attribute.name}
                      onChange={(event) =>
                        updateAttribute(index, "name", event.target.value)
                      }
                      placeholder="Attribute name"
                    />
                    <Input
                      value={attribute.value}
                      onChange={(event) =>
                        updateAttribute(index, "value", event.target.value)
                      }
                      placeholder="Attribute value"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeAttribute(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No custom attributes configured.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Snapshot
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Price</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatPrice(Number(form.price || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Stock</span>
                <Badge
                  variant={
                    stock <= LOW_STOCK_THRESHOLD ? "secondary" : "outline"
                  }
                >
                  {stock}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Featured
                </span>
                <Switch
                  checked={form.featured}
                  onCheckedChange={(checked) => setField("featured", checked)}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Assembly Required
                </span>
                <Switch
                  checked={form.assemblyRequired}
                  onCheckedChange={(checked) =>
                    setField("assemblyRequired", checked)
                  }
                />
              </div>
            </div>
            {error ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Images
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {images.length ? (
                images.map((imageUrl) => (
                  <div
                    key={imageUrl}
                    className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
                  >
                    <Image
                      src={imageUrl}
                      alt={form.name || "Product"}
                      fill
                      sizes="(max-width: 1024px) 50vw, 240px"
                      className="object-cover"
                    />
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-sm text-zinc-500 dark:text-zinc-400">
                  No images uploaded.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Quick Links
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {form.slug ? (
                <Link
                  href={`/products/${form.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  View product page
                </Link>
              ) : null}
              <div>
                <Link
                  href={`/studio/structure/product;${initialProduct._id}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Studio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
