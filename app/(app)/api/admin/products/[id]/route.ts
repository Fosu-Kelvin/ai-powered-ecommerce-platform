import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminUser } from "@/lib/auth/admin";
import { writeClient } from "@/sanity/lib/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ProductPayload {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock?: number;
  featured?: boolean;
  assemblyRequired?: boolean;
  material?: string;
  color?: string;
  dimensions?: string;
  categoryId?: string;
  customAttributes?: Array<{
    _key?: string;
    name?: string;
    value?: string;
  }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await req.json()) as ProductPayload;

  const name = body.name?.trim() ?? "";
  const slug = body.slug?.trim() ?? "";
  const categoryId = body.categoryId?.trim() ?? "";

  if (!name || !slug || !categoryId) {
    return NextResponse.json(
      { error: "Name, slug, and category are required" },
      { status: 400 },
    );
  }

  const customAttributes = (body.customAttributes ?? [])
    .map((attribute) => ({
      _key: attribute._key?.trim() || crypto.randomUUID(),
      _type: "attribute",
      name: attribute.name?.trim() ?? "",
      value: attribute.value?.trim() ?? "",
    }))
    .filter((attribute) => attribute.name && attribute.value);

  await writeClient
    .patch(id)
    .set({
      name,
      slug: { _type: "slug", current: slug },
      description: body.description?.trim() ?? "",
      price: Number(body.price ?? 0),
      stock: Number(body.stock ?? 0),
      featured: Boolean(body.featured),
      assemblyRequired: Boolean(body.assemblyRequired),
      material: body.material?.trim() || undefined,
      color: body.color?.trim() || undefined,
      dimensions: body.dimensions?.trim() ?? "",
      category: { _type: "reference", _ref: categoryId },
      customAttributes,
    })
    .commit();

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${id}`);

  return NextResponse.json({ success: true });
}
