import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://starpress.in").replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/auth/"],
      disallow: ["/api/", "/admin/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
