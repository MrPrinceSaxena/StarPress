export const CONTACT_PHONE = "+91 98765 43210";
export const WHATSAPP_NUMBER = "919876543210";
export const SUPPORT_EMAIL = "support@starpress.in";

export interface NavLink {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export interface TrustBadgeItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: "Diamond" | "Truck" | "ShieldCheck" | "Palette";
}

export interface CategoryItem {
  id: string;
  name: string;
  color: string;
  bgColorClass: string;
  imageSrc: string;
  href: string;
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageSrc: string;
  href: string;
}

export interface BenefitItem {
  id: string;
  title: string;
  subtitle: string;
  circleColor: string;
  iconName: "Diamond" | "Tag" | "Truck" | "Palette";
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  rating: number;
  quote: string;
  avatarSrc: string;
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export const NAV_LINKS: NavLink[] = [
  { label: "Shop", href: "/shop", hasDropdown: true },
  { label: "Categories", href: "/categories" },
  { label: "Custom Printing", href: "/custom-printing" },
  { label: "Bulk Orders", href: "/bulk-orders" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const TRUST_BADGES: TrustBadgeItem[] = [
  {
    id: "badge-1",
    title: "Premium Quality",
    subtitle: "Vibrant & Durable",
    iconName: "Diamond",
  },
  {
    id: "badge-2",
    title: "Fast Delivery",
    subtitle: "Pan India",
    iconName: "Truck",
  },
  {
    id: "badge-3",
    title: "Secure Payments",
    subtitle: "100% Safe",
    iconName: "ShieldCheck",
  },
  {
    id: "badge-4",
    title: "Design Support",
    subtitle: "We're Here to Help",
    iconName: "Palette",
  },
];

export const CATEGORIES: CategoryItem[] = [
  {
    id: "cat-1",
    name: "Business Printing",
    color: "#17C3C0",
    bgColorClass: "bg-cat-teal",
    imageSrc: "/images/cat-business-cards.jpg",
    href: "/shop?category=business-printing",
  },
  {
    id: "cat-2",
    name: "Marketing Materials",
    color: "#F97066",
    bgColorClass: "bg-cat-coral",
    imageSrc: "/images/cat-flyers.jpg",
    href: "/shop?category=marketing-materials",
  },
  {
    id: "cat-3",
    name: "Outdoor Advertising",
    color: "#7A5CF0",
    bgColorClass: "bg-cat-purple",
    imageSrc: "/images/cat-banners.jpg",
    href: "/shop?category=outdoor-advertising",
  },
  {
    id: "cat-4",
    name: "Stationery",
    color: "#2E90FA",
    bgColorClass: "bg-cat-blue",
    imageSrc: "/images/cat-brochures.jpg",
    href: "/shop?category=stationery",
  },
  {
    id: "cat-5",
    name: "Wedding & Events",
    color: "#EE4FA6",
    bgColorClass: "bg-cat-pink",
    imageSrc: "/images/cat-stickers.jpg",
    href: "/shop?category=wedding-events",
  },
  {
    id: "cat-6",
    name: "Packaging",
    color: "#F79A3E",
    bgColorClass: "bg-cat-orange",
    imageSrc: "/images/cat-gifts.jpg",
    href: "/shop?category=packaging",
  },
  {
    id: "cat-7",
    name: "Labels & Stickers",
    color: "#FFCF1B",
    bgColorClass: "bg-brand-yellow",
    imageSrc: "/images/prod-stickers.jpg",
    href: "/shop?category=labels-stickers",
  },
  {
    id: "cat-8",
    name: "Photo & Custom",
    color: "#29C5F6",
    bgColorClass: "bg-brand-cyan",
    imageSrc: "/images/promo-banner.jpg",
    href: "/shop?category=photo-custom-printing",
  },
];

export const BEST_SELLERS: ProductItem[] = [
  {
    id: "prod-1",
    name: "Premium Business Cards",
    price: 299,
    rating: 4.8,
    reviewCount: 320,
    imageSrc: "/images/prod-business-cards.jpg",
    href: "/shop/business-cards",
  },
  {
    id: "prod-2",
    name: "A4 Flyers",
    price: 499,
    rating: 4.6,
    reviewCount: 188,
    imageSrc: "/images/prod-flyers.jpg",
    href: "/shop/a4-flyers",
  },
  {
    id: "prod-3",
    name: "Tri-Fold Brochure",
    price: 599,
    rating: 4.7,
    reviewCount: 112,
    imageSrc: "/images/cat-brochures.jpg",
    href: "/shop/brochures",
  },
  {
    id: "prod-4",
    name: "Vinyl Banner",
    price: 899,
    rating: 4.7,
    reviewCount: 96,
    imageSrc: "/images/prod-banner.jpg",
    href: "/shop/vinyl-banners",
  },
  {
    id: "prod-5",
    name: "Custom Stickers",
    price: 299,
    rating: 4.9,
    reviewCount: 140,
    imageSrc: "/images/prod-stickers.jpg",
    href: "/shop/custom-stickers",
  },
  {
    id: "prod-6",
    name: "Custom Paper Bags",
    price: 699,
    rating: 4.8,
    reviewCount: 84,
    imageSrc: "/images/cat-gifts.jpg",
    href: "/shop/custom-paper-bags",
  },
];

export const WHY_CHOOSE_US: BenefitItem[] = [
  {
    id: "benefit-1",
    title: "High Quality Prints",
    subtitle: "Vibrant & Durable",
    circleColor: "bg-bg-surface-alt border border-border-subtle text-brand-yellow",
    iconName: "Diamond",
  },
  {
    id: "benefit-2",
    title: "Affordable Pricing",
    subtitle: "Value for Everyone",
    circleColor: "bg-bg-surface-alt border border-border-subtle text-brand-yellow",
    iconName: "Tag",
  },
  {
    id: "benefit-3",
    title: "Fast & Reliable",
    subtitle: "Delivery",
    circleColor: "bg-bg-surface-alt border border-border-subtle text-brand-yellow",
    iconName: "Truck",
  },
  {
    id: "benefit-4",
    title: "Easy Customization",
    subtitle: "Design Your Way",
    circleColor: "bg-bg-surface-alt border border-border-subtle text-brand-yellow",
    iconName: "Palette",
  },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "test-1",
    name: "Rohit Mehta",
    role: "Small Business Owner",
    rating: 5,
    quote: "Excellent quality and super fast delivery!",
    avatarSrc: "/images/avatars/rohit.svg",
  },
  {
    id: "test-2",
    name: "Sneha Iyer",
    role: "Event Planner",
    rating: 5,
    quote: "Prints were vibrant and looked amazing!",
    avatarSrc: "/images/avatars/sneha.svg",
  },
  {
    id: "test-3",
    name: "Aman Verma",
    role: "Startup Founder",
    rating: 5,
    quote: "Great service and easy customization!",
    avatarSrc: "/images/avatars/aman.svg",
  },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Shop Catalog",
    links: [
      { label: "Business Cards", href: "/shop/business-cards" },
      { label: "Flyers & Leaflets", href: "/shop/flyers" },
      { label: "Banners & Signage", href: "/shop/banners" },
      { label: "Custom Stickers", href: "/shop/stickers" },
      { label: "Corporate Drinkware", href: "/shop/custom-mugs" },
      { label: "All Categories", href: "/categories" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Star Press", href: "/about" },
      { label: "Contact Support", href: "/contact" },
      { label: "Bulk Corporate Orders", href: "/bulk-orders" },
      { label: "Custom Print Studio", href: "/custom-printing" },
      { label: "Machinery & Equipment", href: "/about#equipment" },
    ],
  },
  {
    title: "Help & Policies",
    links: [
      { label: "Frequently Asked Questions", href: "/faq" },
      { label: "Artwork & Bleed Guidelines", href: "/faq#artwork" },
      { label: "Shipping & Turnaround", href: "/faq#shipping" },
      { label: "100% Reprint Guarantee", href: "/terms#guarantee" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  iconName: "Layers" | "UploadCloud" | "CheckCircle2" | "Printer" | "Truck";
  badgeColorClass: string;
  accentColorClass: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: "01",
    title: "Choose Product",
    description:
      "Browse our catalog of business cards, banners, apparel, packaging, and custom formats.",
    iconName: "Layers",
    badgeColorClass: "border-white/10 text-brand-yellow bg-white/5 font-mono",
    accentColorClass: "text-slate-300 group-hover:text-brand-yellow",
  },
  {
    step: "02",
    title: "Upload Design",
    description:
      "Submit your print-ready file (PDF, AI, PSD, PNG) or specify notes for our pre-press design team.",
    iconName: "UploadCloud",
    badgeColorClass: "border-white/10 text-brand-yellow bg-white/5 font-mono",
    accentColorClass: "text-slate-300 group-hover:text-brand-yellow",
  },
  {
    step: "03",
    title: "Confirm Order",
    description:
      "Review instant transparent pricing, select quantity slabs, and approve your digital proof.",
    iconName: "CheckCircle2",
    badgeColorClass: "border-white/10 text-brand-yellow bg-white/5 font-mono",
    accentColorClass: "text-slate-300 group-hover:text-brand-yellow",
  },
  {
    step: "04",
    title: "Precision Print",
    description:
      "Manufactured on high-grade commercial presses with vibrant finishes and quality control checks.",
    iconName: "Printer",
    badgeColorClass: "border-white/10 text-brand-yellow bg-white/5 font-mono",
    accentColorClass: "text-slate-300 group-hover:text-brand-yellow",
  },
  {
    step: "05",
    title: "Pan-India Delivery",
    description:
      "Carefully packaged with moisture-proof protection and dispatched reliably straight to your door.",
    iconName: "Truck",
    badgeColorClass: "border-white/10 text-brand-yellow bg-white/5 font-mono",
    accentColorClass: "text-slate-300 group-hover:text-brand-yellow",
  },
];

export interface BulkOrderPerk {
  id: string;
  title: string;
  desc: string;
}

export const BULK_ORDER_PERKS: BulkOrderPerk[] = [
  {
    id: "bulk-1",
    title: "Tiered Volume Discounts",
    desc: "Up to 40% wholesale pricing on 500+ units across all print categories.",
  },
  {
    id: "bulk-2",
    title: "Dedicated Print Specialist",
    desc: "Direct single point of contact for pre-press approvals, proofing, and scheduling.",
  },
  {
    id: "bulk-3",
    title: "Free Pre-Production Proof",
    desc: "Digital or physical sample confirmation before initiating large production runs.",
  },
  {
    id: "bulk-4",
    title: "GST Invoicing & Multi-Drop",
    desc: "100% tax-compliant business billing and multi-location dispatch across India.",
  },
];

export interface BulkVolumeTier {
  range: string;
  discount: string;
  perks: string;
  featured?: boolean;
}

export const BULK_VOLUME_TIERS: BulkVolumeTier[] = [
  {
    range: "250 – 500 Units",
    discount: "15% Off",
    perks: "Standard dispatch • Free digital proof",
  },
  {
    range: "500 – 2,500 Units",
    discount: "28% Off",
    perks: "Priority queue • Dedicated manager",
    featured: true,
  },
  {
    range: "2,500+ Units",
    discount: "Up to 40% Off",
    perks: "Custom wholesale rates • Free shipping",
  },
];

