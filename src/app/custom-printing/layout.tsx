import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Printing & Fabrication Studio | Star Press Khatima",
  description:
    "Design and order custom acrylic nameplates, keychains, 3D letter signs, neon boards, and merchandise at Star Press, Khatima. Instant pricing and doorstep delivery.",
  alternates: {
    canonical: "/custom-printing",
  },
  openGraph: {
    title: "Custom Printing & Fabrication Studio | Star Press Khatima",
    description:
      "Bespoke pre-press and fabrication studio by Star Press in Khatima, Uttarakhand. Custom sizes, premium finishes, and instant WhatsApp proofing.",
    url: "https://starpress.in/custom-printing",
  },
};

export default function CustomPrintingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
