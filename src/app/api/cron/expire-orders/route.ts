import { NextRequest, NextResponse } from "next/server";
import { expireStaleOrders, recoverAbandonedCheckouts } from "@/server/order-expiry";

import { timingSafeCompare } from "@/lib/crypto-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Fail closed: reject all cron requests if CRON_SECRET is not configured
  if (!cronSecret) {
    console.error("[Cron Security] CRON_SECRET is not configured. Rejecting cron request.");
    return NextResponse.json({ error: "Cron security not configured." }, { status: 500 });
  }

  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!timingSafeCompare(bearer, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized cron execution." }, { status: 401 });
  }

  try {
    const [recoveryResult, expiryResult] = await Promise.all([
      recoverAbandonedCheckouts(),
      expireStaleOrders(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      recovery: recoveryResult,
      expiry: expiryResult,
    });
  } catch (error: any) {
    console.error("[Cron Expire Orders Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process order expiry." },
      { status: 500 }
    );
  }
}
