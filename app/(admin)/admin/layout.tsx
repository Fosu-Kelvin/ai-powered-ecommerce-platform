import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminAccess } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminAccess();

  return <AdminShell>{children}</AdminShell>;
}
