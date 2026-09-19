import React from "react";
import type { Metadata, Viewport } from "next";
import { Poppins, Inter, Permanent_Marker } from "next/font/google";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import JsonLd from "@/components/seo/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-marker",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://starpress.in"),
  title: {
    default: "Star Press | Turning Ideas Into Print",
    template: "%s | Star Press",
  },
  description:
    "Star Press — premium custom printing e-commerce for business cards, flyers, vinyl banners, custom stickers, packaging, and corporate merchandise. Fast delivery across India.",
  keywords: [
    "custom printing",
    "business cards printing",
    "flyers printing",
    "vinyl banners",
    "die cut stickers",
    "Star Press",
    "printing press Delhi",
    "brochures printing",
    "custom merchandise India",
  ],
  authors: [{ name: "Star Press", url: "https://starpress.in" }],
  creator: "Star Press",
  publisher: "Star Press",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://starpress.in",
    siteName: "Star Press",
    title: "Star Press | Turning Ideas Into Print",
    description:
      "High-quality custom printing for business essentials, event flyers, banners, stickers, and personal creations.",
    images: [
      {
        url: "/images/hero-composition.jpg",
        width: 1200,
        height: 630,
        alt: "Star Press — Custom Printing for Every Idea",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Star Press | Turning Ideas Into Print",
    description:
      "High-quality custom printing for business cards, flyers, banners, and stickers.",
    images: ["/images/hero-composition.jpg"],
    creator: "@starpress",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${permanentMarker.variable}`}
    >
      <head>
        <JsonLd />
      </head>
      <body className="bg-bg-base text-text-primary font-sans antialiased selection:bg-brand-yellow selection:text-black min-h-screen">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
