import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/auth/"],
      disallow: ["/api/", "/admin/"],
    },
    sitemap: "https://www.starpress.in/sitemap.xml",
  };
}
