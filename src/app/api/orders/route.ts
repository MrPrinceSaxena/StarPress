import { NextRequest, NextResponse } from "next/server";
import { createOrder, CreateOrderInput } from "@/server/orders";
import { getSessionUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderInput;

    if (!body || !body.shippingAddress || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Shipping address and at least one item are required." },
        { status: 400 }
      );
    }

    if (!body.shippingAddress.fullName || !body.shippingAddress.phone || !body.shippingAddress.addressLine1) {
      return NextResponse.json(
        { error: "Full name, phone, and delivery address are mandatory." },
        { status: 400 }
      );
    }

    // Enforce authentication for production orders
    let user;
    try {
      user = await getSessionUser();
    } catch {}

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in to place an order." },
        { status: 401 }
      );
    }

    body.userId = user.id;
    body.guestEmail = body.guestEmail || user.email;
    body.guestName = body.guestName || user.name;

    // Read Idempotency Key from standard headers
    const idempotencyKey =
      request.headers.get("Idempotency-Key") ||
      request.headers.get("idempotency-key") ||
      request.headers.get("x-idempotency-key") ||
      body.idempotencyKey;

    if (idempotencyKey) {
      body.idempotencyKey = idempotencyKey;
    }

    const result = await createOrder(body);

    return NextResponse.json(
      {
        success: true,
        order: result.order,
        isExisting: (result as any).isExisting || false,
      },
      { status: (result as any).isExisting ? 200 : 201 }
    );
  } catch (error: any) {
    console.error("API /api/orders error:", error);
    const status = error?.statusCode || 500;
    return NextResponse.json(
      { error: error?.message || "Failed to process order. Please try again." },
      { status }
    );
  }
}
