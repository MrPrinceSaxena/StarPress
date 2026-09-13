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
    name: "Business Cards",
    color: "#17C3C0",
    bgColorClass: "bg-cat-teal",
    imageSrc: "/images/cat-business-cards.jpg",
    href: "/shop/business-cards",
  },
  {
    id: "cat-2",
    name: "Flyers & Leaflets",
    color: "#F97066",
    bgColorClass: "bg-cat-coral",
    imageSrc: "/images/cat-flyers.jpg",
    href: "/shop/flyers",
  },
  {
    id: "cat-3",
    name: "Brochures",
    color: "#2E90FA",
    bgColorClass: "bg-cat-blue",
    imageSrc: "/images/cat-brochures.jpg",
    href: "/shop/brochures",
  },
  {
    id: "cat-4",
    name: "Banners",
    color: "#7A5CF0",
    bgColorClass: "bg-cat-purple",
    imageSrc: "/images/cat-banners.jpg",
    href: "/shop/banners",
  },
  {
    id: "cat-5",
    name: "Stickers",
    color: "#EE4FA6",
    bgColorClass: "bg-cat-pink",
    imageSrc: "/images/cat-stickers.jpg",
    href: "/shop/stickers",
  },
  {
    id: "cat-6",
    name: "Custom Gifts",
    color: "#F79A3E",
    bgColorClass: "bg-cat-orange",
    imageSrc: "/images/cat-gifts.jpg",
    href: "/shop/custom-gifts",
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
    href: "/shop/flyers",
  },
  {
    id: "prod-3",
    name: "Vinyl Banner",
    price: 899,
    rating: 4.7,
    reviewCount: 96,
    imageSrc: "/images/prod-banner.jpg",
    href: "/shop/banners",
  },
  {
    id: "prod-4",
    name: "Custom Stickers",
    price: 299,
    rating: 4.9,
    reviewCount: 140,
    imageSrc: "/images/prod-stickers.jpg",
    href: "/shop/stickers",
  },
];

export const WHY_CHOOSE_US: BenefitItem[] = [
  {
    id: "benefit-1",
    title: "High Quality Prints",
    subtitle: "Vibrant & Durable",
    circleColor: "bg-brand-indigo",
    iconName: "Diamond",
  },
  {
    id: "benefit-2",
    title: "Affordable Pricing",
    subtitle: "Value for Everyone",
    circleColor: "bg-brand-magenta",
    iconName: "Tag",
  },
  {
    id: "benefit-3",
    title: "Fast & Reliable",
    subtitle: "Delivery",
    circleColor: "bg-brand-cyan",
    iconName: "Truck",
  },
  {
    id: "benefit-4",
    title: "Easy Customization",
    subtitle: "Design Your Way",
    circleColor: "bg-cat-pink",
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
    title: "Shop",
    links: [
      { label: "Business Cards", href: "/shop/business-cards" },
      { label: "Flyers & Leaflets", href: "/shop/flyers" },
      { label: "Brochures", href: "/shop/brochures" },
      { label: "Banners", href: "/shop/banners" },
      { label: "Stickers", href: "/shop/stickers" },
      { label: "Custom Gifts", href: "/shop/custom-gifts" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Bulk Orders", href: "/bulk-orders" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQs", href: "/faq" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Track Order", href: "/track-order" },
      { label: "Support", href: "/support" },
    ],
  },
];
