import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bulk & Corporate Printing Services | Star Press Khatima",
  description:
    "Wholesale & bulk printing in Khatima, Uttarakhand. Bulk visiting cards, flex banners, pamphlets, corporate gifting, custom packaging, and signages with wholesale pricing and fast delivery.",
  keywords: [
    "bulk printing Khatima",
    "wholesale printing press Khatima",
    "corporate printing Uttarakhand",
    "bulk visiting cards Khatima",
    "pamphlet printing Khatima",
    "bulk flex banners Khatima",
    "Star Press bulk orders",
  ],
  alternates: {
    canonical: "https://starpress.in/bulk-orders",
  },
  openGraph: {
    title: "Bulk & Corporate Printing Services in Khatima | Star Press",
    description:
      "Wholesale printing partner for businesses, schools, and institutions in Khatima & Uttarakhand. Unmatched quality and tier discounts.",
    url: "https://starpress.in/bulk-orders",
  },
};

export default function BulkOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
