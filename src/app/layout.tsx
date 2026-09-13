import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Star Press | Turning Ideas Into Print",
  description:
    "Star Press — business printing, marketing materials, outdoor advertising, stationery, packaging and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}
