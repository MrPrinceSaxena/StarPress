import { NextRequest, NextResponse } from "next/server";
import { quoteOrder, QuoteOrderInput } from "@/server/quote";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QuoteOrderInput;

    if (!body || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required for a quote preview." },
        { status: 400 }
      );
    }

    const quote = await quoteOrder(body);

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error: any) {
    console.error("API /api/orders/quote error:", error);
    const status = error.statusCode || 500;
    return NextResponse.json(
      { error: error.message || "Failed to calculate server order quote." },
      { status }
    );
  }
}
