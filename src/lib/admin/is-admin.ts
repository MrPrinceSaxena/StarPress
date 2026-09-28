export function isUserAdmin(
  user: {
    email?: string | null;
    app_metadata?: any;
    user_metadata?: any;
    role?: string;
  } | null | undefined
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.app_metadata?.role === "ADMIN") return true;
  if (user.user_metadata?.role === "ADMIN") return true;

  const email = (user.email || "").toLowerCase().trim();
  if (!email) return false;
  if (email === "admin@starpress.in") return true;
  if (email === "starpress.print@gmail.com") return true;
  if (email === "mrdigitalmarketerpro@gmail.com") return true;
  if (email.endsWith("@starpress.in")) return true;

  const adminEnv =
    process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "";
  if (adminEnv) {
    const list = adminEnv.split(",").map((e) => e.trim().toLowerCase());
    if (list.includes(email)) return true;
  }

  return false;
}
