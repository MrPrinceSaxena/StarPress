import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminRootPage() {
  const user = await getAuthenticatedUser();
  const isAdmin = user?.app_metadata?.role === "ADMIN";

  if (!isAdmin) {
    redirect("/admin/login");
  }

  redirect("/admin/orders");
}
