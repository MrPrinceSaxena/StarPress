import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const apiKey = process.env.RESEND_API_KEY || env.RESEND_API_KEY;
    if (!apiKey || !apiKey.trim() || apiKey === "re_test_placeholder") {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured in environment variables." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const recipient = String(body.to || "starpress.print@gmail.com").trim();

    const senderEmail = process.env.NOTIFICATION_EMAIL || "orders@starpress.in";
    const storeName = "Star Press Print Studio";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        from: `${storeName} <${senderEmail}>`,
        to: [recipient],
        subject: "🎨 StarPress Print Studio — Test Email Verification",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #0B0C10; color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #1F2937;">
            <div style="background: linear-gradient(135deg, #111827 0%, #0F172A 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #F5A623;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #F5A623; letter-spacing: -0.5px;">STAR PRESS</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px;">Print Studio &amp; Signage</p>
            </div>
            <div style="padding: 32px 28px;">
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                <p style="margin: 0; color: #34D399; font-size: 14px; font-weight: 700;">✓ Email Delivery Active</p>
                <p style="margin: 4px 0 0 0; color: #A7F3D0; font-size: 12px;">Your Resend email integration is working properly.</p>
              </div>
              <h2 style="font-size: 18px; font-weight: 700; color: #FFFFFF; margin: 0 0 12px 0;">Resend Service Connected Successfully</h2>
              <p style="font-size: 13px; color: #CBD5E1; line-height: 1.6; margin: 0 0 18px 0;">
                This test email confirms that your store can now automatically send order confirmations, digital proof alerts, and shipping updates to customers via Resend.
              </p>
              <div style="background: #111827; border: 1px solid #1E293B; border-radius: 10px; padding: 14px 18px; font-size: 12px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: #64748B;">Sender Address:</span>
                  <strong style="color: #F8FAFC; font-family: monospace;">${senderEmail}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: #64748B;">Recipient:</span>
                  <strong style="color: #F8FAFC; font-family: monospace;">${recipient}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748B;">Timestamp:</span>
                  <strong style="color: #F8FAFC;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</strong>
                </div>
              </div>
              <p style="font-size: 11px; color: #64748B; margin: 0; text-align: center;">
                Star Press Print Studio · Amoun, Khatima (Uttarakhand) · +91 74568 49955
              </p>
            </div>
          </div>
        `,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: resData.message || "Resend rejected email request." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: resData.id,
      recipient,
      sender: senderEmail,
    });
  } catch (error: any) {
    console.error("API /api/admin/email/test error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch test email." },
      { status: 500 }
    );
  }
}
