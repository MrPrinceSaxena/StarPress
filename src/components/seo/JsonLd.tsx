import React from "react";

export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.starpress.in/#organization",
        "name": "Star Press",
        "url": "https://www.starpress.in",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.starpress.in/images/hero-composition.jpg",
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
          "telephone": "+91-74568-49955",
          "contactType": "customer service",
          "areaServed": "IN",
          "availableLanguage": ["English", "Hindi"],
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://www.starpress.in/#website",
        "url": "https://www.starpress.in",
        "name": "Star Press",
        "description": "Turning Ideas Into Print — High Quality Custom Printing",
        "publisher": {
          "@id": "https://www.starpress.in/#organization",
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://www.starpress.in/shop?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": ["LocalBusiness", "PrintShop"],
        "@id": "https://www.starpress.in/#localbusiness",
        "name": "Star Press",
        "alternateName": [
          "Star Press Khatima",
          "Star Printing Press Khatima",
          "Star Press Print Hub",
          "Star Press Amoun"
        ],
        "image": "https://www.starpress.in/images/hero-composition.jpg",
        "logo": "https://www.starpress.in/images/Logo.png",
        "url": "https://www.starpress.in",
        "telephone": "+91-74568-49955",
        "email": "starpress.print@gmail.com",
        "priceRange": "₹₹",
        "currenciesAccepted": "INR",
        "paymentAccepted": "Cash, UPI, Credit Card, Debit Card, Net Banking",
        "hasMap": "https://maps.google.com/?q=Amoun,+Khatima,+Uttarakhand",
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 28.9197,
          "longitude": 79.9723
        },
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Amoun",
          "addressLocality": "Khatima",
          "addressRegion": "Uttarakhand",
          "postalCode": "262308",
          "addressCountry": "IN"
        },
        "areaServed": [
          {
            "@type": "City",
            "name": "Khatima"
          },
          {
            "@type": "AdministrativeArea",
            "name": "Udham Singh Nagar"
          },
          {
            "@type": "AdministrativeArea",
            "name": "Uttarakhand"
          },
          {
            "@type": "Country",
            "name": "India"
          }
        ],
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            "opens": "09:00",
            "closes": "20:00"
          }
        ]
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
