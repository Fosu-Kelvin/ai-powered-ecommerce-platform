import { notFound } from "next/navigation";
import { OrderDetailEditor } from "@/components/admin/OrderDetailEditor";
import { client } from "@/sanity/lib/client";
import { ADMIN_ORDER_DETAIL_QUERY } from "@/sanity/queries/admin";

interface OrderDetailProjection {
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

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const data = await client.fetch<OrderDetailProjection | null>(
    ADMIN_ORDER_DETAIL_QUERY,
    { id },
  );

  if (!data) {
    notFound();
  }
  return <OrderDetailEditor initialData={data} />;
}
