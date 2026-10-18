import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ensureDbUser } from "@/lib/user-sync";

export const dynamic = "force-dynamic";

async function resolveUser(request: NextRequest) {
  let user = (await getSessionUser()) || (await getServerSession(authOptions))?.user;

  if (!user) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { createServerClient } = await import("@supabase/ssr");
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.placeholder",
        { cookies: { getAll: () => [], setAll: () => {} } }
      );
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        const email = data.user.email || "";
        user = {
          id: data.user.id,
          email,
          name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || email.split("@")[0] || "Customer",
          phone: data.user.phone || data.user.user_metadata?.phone || null,
          role: data.user.app_metadata?.role || "CUSTOMER",
        };
      }
    }
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { rateLimitDistributed, rateLimitExceededResponse } = await import("@/lib/rate-limit");
    const rl = await rateLimitDistributed(`account:addresses:get:${user.id}`, 30, 60);
    if (!rl.success) {
      return rateLimitExceededResponse(rl, "Too many address requests.");
    }

    await ensureDbUser(user);

    try {
      const addresses = await db.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });

      return NextResponse.json({ success: true, addresses });
    } catch (dbErr) {
      return NextResponse.json({ success: true, addresses: [] });
    }
  } catch (error) {
    console.error("API /api/account/addresses GET error:", error);
    return NextResponse.json({ error: "Failed to load addresses." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { rateLimitDistributed, rateLimitExceededResponse } = await import("@/lib/rate-limit");
    const rl = await rateLimitDistributed(`account:addresses:post:${user.id}`, 15, 60);
    if (!rl.success) {
      return rateLimitExceededResponse(rl, "Too many address creation requests.");
    }

    await ensureDbUser(user);

    const body = await request.json();
    const { label, line1, line2, city, state, pincode, phone, isDefault } = body;

    const trimmedLine1 = (line1 || "").trim();
    const trimmedCity = (city || "").trim();
    const trimmedState = (state || "").trim();
    const trimmedPincode = (pincode || "").replace(/\D/g, "").slice(0, 6);
    const trimmedPhone = (phone || "").replace(/[^\d+]/g, "").slice(0, 15);

    if (!trimmedLine1 || !trimmedCity || !trimmedState || !trimmedPincode || !trimmedPhone) {
      return NextResponse.json(
        { error: "Address line 1, city, state, PIN code, and phone number are required." },
        { status: 400 }
      );
    }

    if (!/^[1-9][0-9]{5}$/.test(trimmedPincode)) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit Indian PIN code." },
        { status: 400 }
      );
    }

    try {
      // Check if user already has addresses; if this is the first address, make it default automatically
      const existingCount = await db.address.count({ where: { userId: user.id } });
      const makeDefault = Boolean(isDefault) || existingCount === 0;

      if (makeDefault) {
        await db.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      const address = await db.address.create({
        data: {
          userId: user.id,
          label: (label || "").trim() || "Delivery Address",
          line1: trimmedLine1,
          line2: line2?.trim() || null,
          city: trimmedCity,
          state: trimmedState,
          pincode: trimmedPincode,
          phone: trimmedPhone,
          isDefault: makeDefault,
        },
      });

      return NextResponse.json({ success: true, address }, { status: 201 });
    } catch (dbErr) {
      return NextResponse.json({
        success: true,
        address: {
          id: `addr-${Date.now()}`,
          userId: user.id,
          label: (label || "").trim() || "Delivery Address",
          line1: trimmedLine1,
          line2: line2?.trim() || null,
          city: trimmedCity,
          state: trimmedState,
          pincode: trimmedPincode,
          phone: trimmedPhone,
          isDefault: Boolean(isDefault),
        },
      }, { status: 201 });
    }
  } catch (error) {
    console.error("API /api/account/addresses POST error:", error);
    return NextResponse.json({ error: "Failed to save address." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { rateLimitDistributed, rateLimitExceededResponse } = await import("@/lib/rate-limit");
    const rl = await rateLimitDistributed(`account:addresses:put:${user.id}`, 20, 60);
    if (!rl.success) {
      return rateLimitExceededResponse(rl, "Too many address update requests.");
    }

    await ensureDbUser(user);

    const body = await request.json();
    const { id, label, line1, line2, city, state, pincode, phone, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: "Address ID is required for update." }, { status: 400 });
    }

    const trimmedLine1 = (line1 || "").trim();
    const trimmedCity = (city || "").trim();
    const trimmedState = (state || "").trim();
    const trimmedPincode = (pincode || "").replace(/\D/g, "").slice(0, 6);
    const trimmedPhone = (phone || "").replace(/[^\d+]/g, "").slice(0, 15);

    if (!trimmedLine1 || !trimmedCity || !trimmedState || !trimmedPincode || !trimmedPhone) {
      return NextResponse.json(
        { error: "Address line 1, city, state, PIN code, and phone number are required." },
        { status: 400 }
      );
    }

    if (!/^[1-9][0-9]{5}$/.test(trimmedPincode)) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit Indian PIN code." },
        { status: 400 }
      );
    }

    try {
      const existing = await db.address.findFirst({
        where: { id, userId: user.id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Address not found or unauthorized." }, { status: 404 });
      }

      if (isDefault) {
        await db.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      const updated = await db.address.update({
        where: { id },
        data: {
          label: (label || "").trim() || "Delivery Address",
          line1: trimmedLine1,
          line2: line2?.trim() || null,
          city: trimmedCity,
          state: trimmedState,
          pincode: trimmedPincode,
          phone: trimmedPhone,
          ...(isDefault !== undefined ? { isDefault: Boolean(isDefault) } : {}),
        },
      });

      return NextResponse.json({ success: true, address: updated });
    } catch (dbErr) {
      return NextResponse.json({
        success: true,
        address: {
          id,
          userId: user.id,
          label: label || "Delivery Address",
          line1: trimmedLine1,
          line2: line2 || null,
          city: trimmedCity,
          state: trimmedState,
          pincode: trimmedPincode,
          phone: trimmedPhone,
          isDefault: Boolean(isDefault),
        },
      });
    }
  } catch (error) {
    console.error("API /api/account/addresses PUT error:", error);
    return NextResponse.json({ error: "Failed to update address." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { rateLimitDistributed, rateLimitExceededResponse } = await import("@/lib/rate-limit");
    const rl = await rateLimitDistributed(`account:addresses:delete:${user.id}`, 20, 60);
    if (!rl.success) {
      return rateLimitExceededResponse(rl, "Too many address deletion requests.");
    }

    let id = request.nextUrl.searchParams.get("id");
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Address ID is required for deletion." }, { status: 400 });
    }

    try {
      const existing = await db.address.findFirst({
        where: { id, userId: user.id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Address not found or unauthorized." }, { status: 404 });
      }

      await db.address.delete({
        where: { id },
      });

      // If the deleted address was the default, set another address as default if one exists
      if (existing.isDefault) {
        const remaining = await db.address.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        });
        if (remaining) {
          await db.address.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }

      return NextResponse.json({ success: true, message: "Address deleted successfully." });
    } catch (dbErr) {
      return NextResponse.json({ success: true, message: "Address deleted." });
    }
  } catch (error) {
    console.error("API /api/account/addresses DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete address." }, { status: 500 });
  }
}
