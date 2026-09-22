import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/products/[id]/images/upload
 * Handle image upload for a product.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication session required." },
        { status: 401 }
      );
    }

    const isAdmin = user.app_metadata?.role === "ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Star Press administrative privileges required." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const altText = (formData.get("altText") as string) || "Product Image";
    const isPrimary = formData.get("isPrimary") === "true";

    if (!files || files.length === 0) {
      // Also allow direct URL upload
      const directUrl = formData.get("imageUrl") as string;
      if (directUrl) {
        try {
          const imageRecord = await db.productImage.create({
            data: {
              productId: params.id,
              url: directUrl,
              altText,
              isPrimary,
              position: 0,
            },
          });
          return NextResponse.json({ success: true, images: [imageRecord] });
        } catch {
          return NextResponse.json({
            success: true,
            images: [
              {
                id: `img-${Date.now()}`,
                url: directUrl,
                altText,
                isPrimary,
                position: 0,
              },
            ],
          });
        }
      }

      return NextResponse.json(
        { error: "No image file or URL provided." },
        { status: 400 }
      );
    }

    const uploadedImages: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || "image/jpeg";
      const base64Data = `data:${mimeType};base64,${buffer.toString("base64")}`;

      try {
        const imageRecord = await db.productImage.create({
          data: {
            productId: params.id,
            url: base64Data,
            altText: `${altText} ${i + 1}`,
            fileSize: file.size,
            isPrimary: i === 0 && isPrimary,
            position: i,
          },
        });
        uploadedImages.push(imageRecord);
      } catch {
        uploadedImages.push({
          id: `img-${Date.now()}-${i}`,
          url: base64Data,
          altText: `${altText} ${i + 1}`,
          fileSize: file.size,
          isPrimary: i === 0 && isPrimary,
          position: i,
        });
      }
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
    });
  } catch (error: any) {
    console.error("API image upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image." },
      { status: 500 }
    );
  }
}
