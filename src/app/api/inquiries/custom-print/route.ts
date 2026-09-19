import { NextRequest, NextResponse } from "next/server";
import { createCustomPrintInquiry, CustomPrintInquiryInput } from "@/server/inquiries";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CustomPrintInquiryInput;

    if (!body.name || !body.phone || !body.productType) {
      return NextResponse.json(
        { error: "Name, contact phone number, and product type are required." },
        { status: 400 }
      );
    }

    const result = await createCustomPrintInquiry(body);

    return NextResponse.json({
      success: true,
      inquiryNumber: result.inquiryNumber,
      message: "Custom printing quote request received. Our team will review your specs within 2 hours.",
    });
  } catch (error) {
    console.error("API /api/inquiries/custom-print error:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please contact us directly via WhatsApp." },
      { status: 500 }
    );
  }
}
