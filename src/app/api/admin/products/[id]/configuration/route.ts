import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { db } from "@/lib/db";
import { productConfigurationSchema } from "@/lib/product-configuration";
import { publishConfiguration, saveConfigurationDraft } from "@/server/product-configuration";
export const dynamic = "force-dynamic";
type Context = { params: { id: string } };
export async function GET(request: NextRequest, { params }: Context) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const draft = await db.productConfigurationDraft.findUnique({ where: { productId: params.id } });
    return NextResponse.json({ draft }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Configuration storage is unavailable." }, { status: 503 });
  }
}
const payload = z.object({ expectedRevision: z.number().int().min(0).max(2147483646), configuration: productConfigurationSchema });
export async function PUT(request: NextRequest, { params }: Context) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = payload.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid configuration", issues: parsed.error.issues }, { status: 400 });
  try {
    const draft = await saveConfigurationDraft(params.id, parsed.data.expectedRevision, parsed.data.configuration, auth.user?.email || auth.user!.id);
    return NextResponse.json({ draft });
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode || 503;
    return NextResponse.json({ error: status === 503 ? "Configuration could not be saved." : (error as Error).message }, { status });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (process.env.PRODUCT_CONFIGURATION_ENABLED === "false") return NextResponse.json({ error: "Configuration rollout is not enabled." }, { status: 503 });
  const parsed = z.object({ revision: z.number().int().positive() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid revision" }, { status: 400 });
  try { const configuration = await publishConfiguration(params.id, parsed.data.revision, auth.user!.email); revalidatePath("/shop/[slug]", "page"); return NextResponse.json({ configuration }); }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: (error as { statusCode?: number }).statusCode || 503 }); }
}
