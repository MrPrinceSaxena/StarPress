import type { Metadata } from "next";
import { Poppins, Inter, Permanent_Marker } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Star Press | Turning Ideas Into Print",
  description:
    "Custom printing e-commerce for business cards, flyers, banners, stickers, and custom gifts. High-quality prints for every idea.",
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
      <body className="bg-bg-base text-text-primary font-sans antialiased selection:bg-brand-yellow selection:text-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
