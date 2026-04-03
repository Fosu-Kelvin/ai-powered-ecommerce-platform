"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
} from "lucide-react";
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
import { StackedProductImages } from "@/components/app/StackedProductImages";
import {
  ORDER_STATUS_VALUES,
  getOrderStatus,
} from "@/lib/constants/orderStatus";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/utils";

interface OrderDetailData {
  _id: string;
  orderNumber: string | null;
  email: string | null;
  total: number | null;
  status: string | null;
  createdAt: string | null;
  paystackReference: string | null;
  itemCount: number;
  itemImages: Array<string | null> | null;
  items: Array<{
    _key: string;
    quantity: number | null;
    priceAtPurchase: number | null;
    product: {
      _id: string;
      name: string | null;
      slug: string | null;
      imageUrl: string | null;
    } | null;
  }> | null;
  address: {
    name: string | null;
    hostelName: string | null;
    roomNumber: string | null;
    location: string | null;
  } | null;
}

export function OrderDetailEditor({
  initialData,
}: {
  initialData: OrderDetailData;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialData.status ?? "paid");
  const [address, setAddress] = useState({
    name: initialData.address?.name ?? "",
    hostelName: initialData.address?.hostelName ?? "",
    roomNumber: initialData.address?.roomNumber ?? "",
    location: initialData.address?.location ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const statusConfig = getOrderStatus(status);
  const StatusIcon = statusConfig.icon;
  const images = (initialData.itemImages ?? []).flatMap((url) =>
    typeof url === "string" && url.length > 0 ? [url] : [],
  );

  const updateAddress = (field: keyof typeof address, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaved(false);

    const response = await fetch(`/api/admin/orders/${initialData._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, address }),
    });

    const result = (await response.json()) as { error?: string };

    setIsSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Failed to save order changes.");
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              Order #{formatOrderNumber(initialData.orderNumber)}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {formatDate(initialData.createdAt, "datetime", "Unknown date")}
            </p>
          </div>
        </div>
        <Badge
          className={`${statusConfig.color} flex w-fit items-center gap-1.5`}
        >
          <StatusIcon className="h-4 w-4" />
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Order Items
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {initialData.itemCount}{" "}
                  {initialData.itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <StackedProductImages
                images={images}
                totalCount={initialData.itemCount}
                size="md"
                hoverScale={false}
              />
            </div>

            <div className="space-y-3">
              {initialData.items?.length ? (
                initialData.items.map((item) => (
                  <div
                    key={item._key}
                    className="flex gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {item.product?.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name ?? "Product"}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-400">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {item.product?.slug ? (
                        <Link
                          href={`/products/${item.product.slug}`}
                          target="_blank"
                          className="font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
                        >
                          {item.product.name ?? "Unknown Product"}
                        </Link>
                      ) : (
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {item.product?.name ?? "Unknown Product"}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Qty: {item.quantity ?? 0}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {formatPrice(
                          (item.priceAtPurchase ?? 0) * (item.quantity ?? 0),
                        )}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {formatPrice(item.priceAtPurchase ?? 0)} each
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No items found in this order.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Delivery Address
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="customer-name">Full Name</Label>
                <Input
                  id="customer-name"
                  value={address.name}
                  onChange={(event) =>
                    updateAddress("name", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hostel-name">Hostel Name</Label>
                <Input
                  id="hostel-name"
                  value={address.hostelName}
                  onChange={(event) =>
                    updateAddress("hostelName", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room-number">Room Number</Label>
                <Input
                  id="room-number"
                  value={address.roomNumber}
                  onChange={(event) =>
                    updateAddress("roomNumber", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={address.location}
                  onChange={(event) =>
                    updateAddress("location", event.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Fulfilment
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Update the order status and delivery details here.
            </p>
            <div className="mt-4 space-y-3">
              <Label htmlFor="order-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="order-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {getOrderStatus(value).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4 flex items-center gap-3">
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
              {saved ? (
                <span className="text-sm text-emerald-600 dark:text-emerald-400">
                  Saved
                </span>
              ) : null}
            </div>
            {error ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Summary
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Customer
                </span>
                <span className="max-w-[60%] truncate text-right text-zinc-900 dark:text-zinc-100">
                  {initialData.email ?? "No email"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Items</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {initialData.itemCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Total</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatPrice(initialData.total ?? 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Payment
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Status</span>
                <span className="font-medium capitalize text-zinc-900 dark:text-zinc-100">
                  {status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Reference
                </span>
                <span className="max-w-[60%] truncate text-right text-zinc-900 dark:text-zinc-100">
                  {initialData.paystackReference ?? "No reference"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Order Actions
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <Link
                href={`/studio/structure/order;${initialData._id}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <ExternalLink className="h-4 w-4" />
                Open full document in Studio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
