import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/admin/auth-check";
import { getAllCategories } from "@/lib/catalog";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const now = new Date().toISOString();

    // 1. Core live pages
    const corePages = [
      {
        id: "cnt_home",
        title: "Storefront Home",
        slug: "",
        type: "page",
        status: "published",
        author: "Star Press",
        views: 0,
        updatedAt: now,
      },
      {
        id: "cnt_shop",
        title: "Commercial Print Catalog",
        slug: "shop",
        type: "catalog",
        status: "published",
        author: "Star Press",
        views: 0,
        updatedAt: now,
      },
      {
        id: "cnt_categories",
        title: "Product Categories Hub",
        slug: "categories",
        type: "catalog",
        status: "published",
        author: "Star Press",
        views: 0,
        updatedAt: now,
      },
      {
        id: "cnt_custom",
        title: "Custom Printing & Fabrication",
        slug: "custom-printing",
        type: "service",
        status: "published",
        author: "Star Press",
        views: 0,
        updatedAt: now,
      },
      {
        id: "cnt_bulk",
        title: "Bulk & Corporate Orders",
        slug: "bulk-orders",
        type: "service",
        status: "published",
        author: "Star Press",
        views: 0,
        updatedAt: now,
      },
      {
        id: "cnt_about",
        title: "About Star Press Khatima",
        slug: "about",
        type: "page",
        status: "published",
        author: "Star Press",
        views: 0,
        updatedAt: now,
      },
      {
        id: "cnt_contact",
        title: "Contact & Support Desk",
        slug: "contact",
        type: "page",
        status: "published",
        author: "Star Press",
        views: 0,
        updatedAt: now,
      },
      {
        id: "cnt_faq",
        title: "Frequently Asked Questions",
        slug: "faq",
        type: "page",
        status: "published",
        author: "Star Press",
        views: 0,
        updatedAt: now,
      },
      {
        id: "cnt_privacy",
        title: "Privacy Policy",
        slug: "privacy",
        type: "policy",
        status: "published",
        author: "Star Press Legal",
        views: 0,
        updatedAt: now,
      },
      {
        id: "cnt_terms",
        title: "Terms & Conditions",
        slug: "terms",
        type: "policy",
        status: "published",
        author: "Star Press Legal",
        views: 0,
        updatedAt: now,
      },
      {
        id: "cnt_refund",
        title: "Cancellation & Refund Policy",
        slug: "cancellation-refund",
        type: "policy",
        status: "published",
        author: "Star Press Legal",
        views: 0,
        updatedAt: now,
      },
      {
        id: "cnt_shipping",
        title: "Shipping & Delivery Policy",
        slug: "shipping-policy",
        type: "policy",
        status: "published",
        author: "Star Press Operations",
        views: 0,
        updatedAt: now,
      },
    ];

    // 2. Real category collections
    const categories = getAllCategories();
    const categoryPages = categories.map((cat) => ({
      id: `cnt_cat_${cat.id}`,
      title: `${cat.name} Collection`,
      slug: `shop?category=${cat.slug}`,
      type: "collection",
      status: "published",
      author: "Catalog Manager",
      views: 0,
      updatedAt: now,
    }));

    return NextResponse.json({
      success: true,
      pages: [...corePages, ...categoryPages],
    });
  } catch (error: any) {
    console.error("API /api/admin/content GET error:", error);
    return NextResponse.json(
      { error: "Failed to load content pages." },
      { status: 500 }
    );
  }
}
