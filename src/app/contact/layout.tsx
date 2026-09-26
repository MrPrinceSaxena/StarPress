import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Star Press | Printing Press in Khatima, Uttarakhand",
  description:
    "Contact Star Press (Amoun, Khatima, Uttarakhand). Call +91 74568 49955, email starpress.print@gmail.com, or chat on WhatsApp for printing quotes, artwork reviews, and status updates.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Star Press | Printing Press in Khatima, Uttarakhand",
    description:
      "Facility address, customer hotline (+91 74568 49955), and direct WhatsApp desk for Star Press in Amoun, Khatima (Uttarakhand).",
    url: "https://starpress.in/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
