import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/admin/is-admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const isAdmin = isUserAdmin(user);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    // Direct automated refunds are disabled. Refunds must be handled manually by admin via WhatsApp or phone.
    return NextResponse.json(
      {
        error:
          "Direct automated refunds from the admin panel are currently disabled. Please contact the customer directly via WhatsApp or phone to coordinate manual refund.",
      },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("API /api/admin/orders/[id]/refund error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process request." },
      { status: 500 }
    );
  }
}
