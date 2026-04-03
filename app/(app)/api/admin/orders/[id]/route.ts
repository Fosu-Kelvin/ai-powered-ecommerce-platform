import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminUser } from "@/lib/auth/admin";
import { ORDER_STATUS_VALUES } from "@/lib/constants/orderStatus";
import { writeClient } from "@/sanity/lib/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await req.json()) as {
    status?: string;
    address?: {
      name?: string;
      hostelName?: string;
      roomNumber?: string;
      location?: string;
    };
  };

  if (!body.status || !ORDER_STATUS_VALUES.includes(body.status as never)) {
    return NextResponse.json(
      { error: "Invalid order status" },
      { status: 400 },
    );
  }

  const address = {
    name: body.address?.name?.trim() ?? "",
    hostelName: body.address?.hostelName?.trim() ?? "",
    roomNumber: body.address?.roomNumber?.trim() ?? "",
    location: body.address?.location?.trim() ?? "",
  };

  await writeClient.patch(id).set({ status: body.status, address }).commit();

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath(`/orders/${id}`);

  return NextResponse.json({ success: true });
}
