import React from "react";

export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://starpress.in/#organization",
        "name": "Star Press",
        "url": "https://starpress.in",
        "logo": {
          "@type": "ImageObject",
          "url": "https://starpress.in/images/hero-composition.jpg",
          "width": 1200,
          "height": 630,
        },
        "description":
          "Star Press is a premier custom printing service specializing in business cards, flyers, banners, stickers, packaging, and custom merchandise.",
        "sameAs": [
          "https://instagram.com",
          "https://youtube.com",
          "https://linkedin.com",
          "https://twitter.com",
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91-98765-43210",
          "contactType": "customer service",
          "areaServed": "IN",
          "availableLanguage": ["English", "Hindi"],
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://starpress.in/#website",
        "url": "https://starpress.in",
        "name": "Star Press",
        "description": "Turning Ideas Into Print — High Quality Custom Printing",
        "publisher": {
          "@id": "https://starpress.in/#organization",
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://starpress.in/shop?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://starpress.in/#localbusiness",
        "name": "Star Press (Star Printing Press)",
        "image": "https://starpress.in/images/hero-composition.jpg",
        "priceRange": "₹₹",
        "telephone": "+91-98765-43210",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "New Delhi",
          "addressRegion": "Delhi",
          "addressCountry": "IN",
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ],
            "opens": "09:00",
            "closes": "20:00",
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
