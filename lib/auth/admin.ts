import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

function getNormalizedAdminEmail() {
  return process.env.ADMIN_CLERK_EMAIL?.trim().toLowerCase() ?? "";
}

function getUserEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  return email.trim().toLowerCase();
}

export async function requireAdminAccess() {
  const { userId } = await auth();
  const user = await currentUser();
  const adminEmail = getNormalizedAdminEmail();
  const userEmail = getUserEmail(user);

  if (!userId || !adminEmail || userEmail !== adminEmail) {
    notFound();
  }

  return { userId, user, userEmail };
}

export async function isAdminUser() {
  const { userId } = await auth();
  if (!userId) {
    return false;
  }

  const user = await currentUser();
  const adminEmail = getNormalizedAdminEmail();
  const userEmail = getUserEmail(user);

  return Boolean(adminEmail) && userEmail === adminEmail;
}
