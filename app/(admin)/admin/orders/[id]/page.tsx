"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  useDocumentProjection,
  type DocumentHandle,
} from "@sanity/sdk-react";
import { ArrowLeft, CreditCard, ExternalLink, MapPin, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StackedProductImages } from "@/components/app/StackedProductImages";
import { AddressEditor, StatusSelect } from "@/components/admin";
import { getOrderStatus } from "@/lib/constants/orderStatus";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/utils";

interface OrderDetailProjection {
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
    line1: string | null;
    line2: string | null;
    city: string | null;
    postcode: string | null;
    country: string | null;
  } | null;
}

function OrderDetailContent({ handle }: { handle: DocumentHandle }) {
  const { data } = useDocumentProjection<OrderDetailProjection>({
    ...handle,
    projection: `{
      orderNumber,
      email,
      total,
      status,
      createdAt,
      paystackReference,
      "itemCount": count(items),
      "itemImages": items[].product->images[0].asset->url,
      items[]{
        _key,
        quantity,
        priceAtPurchase,
        product->{
          _id,
          name,
          "slug": slug.current,
          "imageUrl": images[0].asset->url
        }
      },
      address
    }`,
  });

  if (!data) {
    return null;
  }

  const status = getOrderStatus(data.status);
  const StatusIcon = status.icon;
  const images = (data.itemImages ?? []).flatMap((url) =>
    typeof url === "string" && url.length > 0 ? [url] : [],
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Order #{formatOrderNumber(data.orderNumber)}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {formatDate(data.createdAt, "datetime", "Unknown date")}
          </p>
        </div>
        <Badge className={`${status.color} flex w-fit items-center gap-1.5`}>
          <StatusIcon className="h-4 w-4" />
          {status.label}
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
                  {data.itemCount} {data.itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <StackedProductImages
                images={images}
                totalCount={data.itemCount}
                size="md"
                hoverScale={false}
              />
            </div>

            <div className="space-y-3">
              {data.items && data.items.length > 0 ? (
                data.items.map((item) => (
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
            <AddressEditor {...handle} />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Fulfilment
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Move the order through your manual delivery workflow.
            </p>
            <div className="mt-4">
              <StatusSelect {...handle} />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Summary
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Customer</span>
                <span className="max-w-[60%] truncate text-right text-zinc-900 dark:text-zinc-100">
                  {data.email ?? "No email"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Items</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {data.itemCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Total</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatPrice(data.total ?? 0)}
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
                  {data.status ?? "paid"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Reference
                </span>
                <span className="max-w-[60%] truncate text-right text-zinc-900 dark:text-zinc-100">
                  {data.paystackReference ?? "No reference"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Open in Studio
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Use Sanity Studio for deeper editing if needed.
            </p>
            <Link
              href={`/studio/structure/order;${handle.documentId}`}
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
            >
              Open order in Studio
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-6 lg:col-span-3">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const handle: DocumentHandle = {
    documentId: id,
    documentType: "order",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Link>

      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetailContent handle={handle} />
      </Suspense>
    </div>
  );
}
