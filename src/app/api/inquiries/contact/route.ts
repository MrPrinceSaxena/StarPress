import { NextRequest, NextResponse } from "next/server";
import { createContactInquiry, ContactInquiryInput } from "@/server/inquiries";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactInquiryInput;

    if (!body.name || !body.message) {
      return NextResponse.json(
        { error: "Name and message are required." },
        { status: 400 }
      );
    }

    const result = await createContactInquiry(body);

    return NextResponse.json({
      success: true,
      inquiryNumber: result.inquiryNumber,
      message: "Your message has been delivered to our desk. We respond to all queries within one business day.",
    });
  } catch (error) {
    console.error("API /api/inquiries/contact error:", error);
    return NextResponse.json(
      { error: "Failed to submit message." },
      { status: 500 }
    );
  }
}
