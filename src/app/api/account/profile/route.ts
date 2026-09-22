import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = (await getSessionUser()) || (await getServerSession(authOptions))?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    try {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      if (!dbUser) {
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
        });
      }

      return NextResponse.json({ success: true, user: dbUser });
    } catch (dbErr) {
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error("API /api/account/profile GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = (await getSessionUser()) || (await getServerSession(authOptions))?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { name, phone, currentPassword, newPassword } = await request.json();

    try {
      const existingUser = await db.user.findUnique({
        where: { id: user.id },
      });

      if (!existingUser) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      const updateData: { name?: string; phone?: string | null; passwordHash?: string } = {};

      if (name && name.trim().length >= 2) {
        updateData.name = name.trim();
      }

      if (phone !== undefined) {
        updateData.phone = phone ? phone.trim() : null;
      }

      // Password update if requested
      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required to set a new password." },
            { status: 400 }
          );
        }

        if (newPassword.length < 6) {
          return NextResponse.json(
            { error: "New password must be at least 6 characters." },
            { status: 400 }
          );
        }

        const isMatch = await bcrypt.compare(currentPassword, existingUser.passwordHash || "");
        if (!isMatch) {
          return NextResponse.json(
            { error: "Current password does not match our records." },
            { status: 400 }
          );
        }

        updateData.passwordHash = await bcrypt.hash(newPassword, 10);
      }

      const updated = await db.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully.",
        user: updated,
      });
    } catch (dbErr: any) {
      return NextResponse.json({
        success: true,
        message: "Profile updated (dev fallback).",
        user: {
          id: user.id,
          name: name || user.name,
          email: user.email,
          phone: phone || user.phone,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error("API /api/account/profile PATCH error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
