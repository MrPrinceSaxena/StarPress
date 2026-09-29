import { NextRequest, NextResponse } from "next/server";
import { createOrder, CreateOrderInput } from "@/server/orders";
import { getSessionUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderInput;

    if (!body.shippingAddress || !body.items || body.items.length === 0) {
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

    // Enforce authentication for production-ready orders
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

    const result = await createOrder(body);

    return NextResponse.json({
      success: true,
      order: result.order,
      isFallback: result.isFallback,
    });
  } catch (error) {
    console.error("API /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to process order. Please try again or reach out via WhatsApp." },
      { status: 500 }
    );
  }
}
