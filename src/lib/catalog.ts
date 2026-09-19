import { BUSINESS_PRINTING_PRODUCTS } from "./catalog-data/business-printing";
import { MARKETING_MATERIALS_PRODUCTS } from "./catalog-data/marketing-materials";
import { OUTDOOR_ADVERTISING_PRODUCTS } from "./catalog-data/outdoor-advertising";
import { STATIONERY_PRODUCTS } from "./catalog-data/stationery";
import { WEDDING_EVENTS_PRODUCTS } from "./catalog-data/wedding-events";
import { PACKAGING_PRODUCTS } from "./catalog-data/packaging";
import { LABELS_STICKERS_PRODUCTS } from "./catalog-data/labels-stickers";
import { PHOTO_CUSTOM_PRODUCTS } from "./catalog-data/photo-custom";

export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string;
  badgeColorClass: string;
  accentColor: string;
}

export interface ProductVariantSize {
  id: string;
  label: string;
  dimensions?: string;
  multiplier: number;
  default?: boolean;
}

export interface ProductVariantMaterial {
  id: string;
  label: string;
  description?: string;
  extraPricePerUnit: number;
  default?: boolean;
}

export interface ProductQuantityTier {
  quantity: number;
  discountPercent: number;
  default?: boolean;
}

export interface ProductCustomizationRule {
  hasCustomText?: boolean;
  textPricePerChar?: number;
  freeCharLimit?: number;
  hasFileUpload?: boolean;
  uploadInstructions?: string;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  images: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  tags: string[];
  sizeOptions: ProductVariantSize[];
  materialOptions: ProductVariantMaterial[];
  quantityTiers: ProductQuantityTier[];
  customizationRules?: ProductCustomizationRule;
  specifications: Record<string, string>;
  features: string[];
  pricingModel?: "batch" | "unit";
  baseQuantity?: number;
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "cat-1",
    slug: "business-printing",
    name: "Business Printing",
    tagline: "First impressions that close deals",
    description: "Corporate cards, letterheads, invoice books, and stationery that build professional brand credibility.",
    imageUrl: "/images/cat-business-cards.jpg",
    badgeColorClass: "bg-cat-teal text-white",
    accentColor: "#17C3C0",
  },
  {
    id: "cat-2",
    slug: "marketing-materials",
    name: "Marketing Materials",
    tagline: "Print collateral that commands attention",
    description: "High-impact promotional flyers, brochures, posters, and pamphlets for sales campaigns and events.",
    imageUrl: "/images/cat-flyers.jpg",
    badgeColorClass: "bg-cat-coral text-white",
    accentColor: "#F97066",
  },
  {
    id: "cat-3",
    slug: "outdoor-advertising",
    name: "Outdoor Advertising",
    tagline: "Weather-resistant, large-format visibility",
    description: "High-durability flex banners, standees, glow signboards, and neon boards engineered for outdoors.",
    imageUrl: "/images/cat-banners.jpg",
    badgeColorClass: "bg-cat-purple text-white",
    accentColor: "#7A5CF0",
  },
  {
    id: "cat-4",
    slug: "stationery",
    name: "Stationery",
    tagline: "Branded corporate essentials",
    description: "Executive notebooks, diaries, branded notepads, certificate printing, and ID cards for everyday work.",
    imageUrl: "/images/cat-brochures.jpg",
    badgeColorClass: "bg-cat-blue text-white",
    accentColor: "#2E90FA",
  },
  {
    id: "cat-5",
    slug: "wedding-events",
    name: "Wedding & Events",
    tagline: "Celebrations crafted in stunning ink",
    description: "Luxurious foil-pressed wedding cards, celebration invitations, ceremony tickets, and menus.",
    imageUrl: "/images/cat-stickers.jpg",
    badgeColorClass: "bg-cat-pink text-white",
    accentColor: "#EE4FA6",
  },
  {
    id: "cat-6",
    slug: "packaging",
    name: "Packaging",
    tagline: "Custom unboxing experiences",
    description: "Premium kraft and bleached paper bags, corrugated boxes, branded shipping labels, and product tags.",
    imageUrl: "/images/cat-gifts.jpg",
    badgeColorClass: "bg-cat-orange text-white",
    accentColor: "#F79A3E",
  },
  {
    id: "cat-7",
    slug: "labels-stickers",
    name: "Labels & Stickers",
    tagline: "Durable adhesives in any die-cut shape",
    description: "Waterproof vinyl logo stickers, bottle labels, barcode rolls, and holographic brand seals.",
    imageUrl: "/images/prod-stickers.jpg",
    badgeColorClass: "bg-brand-yellow text-black",
    accentColor: "#FFCF1B",
  },
  {
    id: "cat-8",
    slug: "photo-custom-printing",
    name: "Photo & Custom Printing",
    tagline: "Personalized memorabilia & corporate gifts",
    description: "Museum-grade canvas prints, customized t-shirts, ceramic mugs, and acrylic photo frames.",
    imageUrl: "/images/promo-banner.jpg",
    badgeColorClass: "bg-brand-cyan text-black",
    accentColor: "#29C5F6",
  },
];

// Assembled catalog of 49 products spanning all 8 core categories per PRD §5.1.1
export const CATALOG_PRODUCTS: CatalogProduct[] = [
  ...BUSINESS_PRINTING_PRODUCTS,
  ...MARKETING_MATERIALS_PRODUCTS,
  ...OUTDOOR_ADVERTISING_PRODUCTS,
  ...STATIONERY_PRODUCTS,
  ...WEDDING_EVENTS_PRODUCTS,
  ...PACKAGING_PRODUCTS,
  ...LABELS_STICKERS_PRODUCTS,
  ...PHOTO_CUSTOM_PRODUCTS,
];

export const PRODUCT_SLUG_ALIASES: Record<string, string> = {
  // Flyers & Leaflets
  "flyers": "a4-flyers",
  "flyer": "a4-flyers",
  "leaflets": "leaflets",
  "leaflet": "leaflets",
  "posters": "posters",
  "poster": "posters",
  "pamphlets": "pamphlets",
  "pamphlet": "pamphlets",
  "catalogues": "catalogues",
  "catalogue": "catalogues",
  "catalogs": "catalogues",
  "catalog": "catalogues",

  // Banners & Outdoor Signage
  "flex": "flex-printing",
  "flex-banner": "flex-printing",
  "flex-banners": "flex-printing",
  "banners": "vinyl-banners",
  "banner": "vinyl-banners",
  "vinyl-banner": "vinyl-banners",
  "hanging-banner": "hanging-banners",
  "hoarding": "hoardings",
  "billboard": "hoardings",
  "billboards": "hoardings",
  "standee": "standees",
  "roll-up-standee": "standees",
  "rollup-standee": "standees",
  "glow-sign": "glow-signs",
  "glow-signs": "glow-signs",
  "glow-sign-board": "glow-signs",
  "glow-sign-boards": "glow-signs",
  "neon": "neon-boards",
  "neon-board": "neon-boards",
  "neon-sign": "neon-boards",
  "neon-signs": "neon-boards",
  "3d-letter": "3d-letter-board",
  "3d-letters": "3d-letter-board",
  "3d-letter-boards": "3d-letter-board",
  "channel-letters": "3d-letter-board",
  "name-plate": "name-plates",
  "nameplate": "name-plates",
  "nameplates": "name-plates",
  "acrylic-board": "acrylic-boards",
  "acrylic-sign": "acrylic-boards",
  "acrylic-signs": "acrylic-boards",

  // Stickers & Labels
  "stickers": "custom-stickers",
  "sticker": "custom-stickers",
  "die-cut-stickers": "custom-stickers",
  "die-cut-sticker": "custom-stickers",
  "custom-diecut-stickers": "custom-shape-stickers",
  "custom-shape-stickers": "custom-shape-stickers",
  "shape-stickers": "custom-shape-stickers",
  "sticker-sheet": "custom-shape-stickers",
  "sticker-sheets": "custom-shape-stickers",
  "labels": "bottle-labels",
  "label": "bottle-labels",
  "bottle-label": "bottle-labels",
  "barcode": "barcode-labels",
  "barcodes": "barcode-labels",
  "barcode-label": "barcode-labels",
  "transparent-stickers": "transparent-stickers",
  "transparent-sticker": "transparent-stickers",
  "clear-stickers": "transparent-stickers",
  "clear-sticker": "transparent-stickers",
  "holographic": "holographic-stickers",
  "hologram": "holographic-stickers",
  "hologram-stickers": "holographic-stickers",
  "holographic-sticker": "holographic-stickers",

  // Photo & Custom Printing / Drinkware & Apparel
  "custom-mugs": "mug-printing",
  "mugs": "mug-printing",
  "mug": "mug-printing",
  "custom-gifts": "mug-printing",
  "t-shirts": "t-shirt-printing",
  "t-shirt": "t-shirt-printing",
  "tshirts": "t-shirt-printing",
  "tshirt": "t-shirt-printing",
  "apparel": "t-shirt-printing",
  "keychain": "keychain-printing",
  "keychains": "keychain-printing",
  "key-chains": "keychain-printing",
  "photo-print": "photo-prints",
  "photos": "photo-prints",
  "photo": "photo-prints",
  "canvas": "canvas-prints",
  "canvas-art": "canvas-prints",
  "canvas-print": "canvas-prints",
  "photo-frame": "photo-frames",
  "photo-frames": "photo-frames",
  "frames": "photo-frames",
  "frame": "photo-frames",

  // Packaging & Bags
  "packaging": "packaging-boxes",
  "packaging-box": "packaging-boxes",
  "boxes": "packaging-boxes",
  "box": "packaging-boxes",
  "paper-bags": "custom-paper-bags",
  "paper-bag": "custom-paper-bags",
  "bags": "custom-paper-bags",
  "packaging-label": "packaging-labels",
  "hang-tag": "hang-tags",
  "hang-tags": "hang-tags",
  "tags": "hang-tags",
  "tag": "hang-tags",

  // Business Stationery & Cards
  "cards": "business-cards",
  "card": "business-cards",
  "business-card": "business-cards",
  "visiting-card": "business-cards",
  "visiting-cards": "business-cards",
  "letterhead": "letterheads",
  "letter-heads": "letterheads",
  "envelope": "envelopes",
  "bill-book": "bill-books",
  "bill-books": "bill-books",
  "invoice-book": "invoice-books",
  "invoice-books": "invoice-books",
  "company-profile": "company-profiles",
  "company-profiles": "company-profiles",
  "notebook": "notebooks",
  "notebooks": "notebooks",
  "diary": "diaries",
  "diaries": "diaries",
  "executive-diaries": "diaries",
  "executive-diary": "diaries",
  "notepad": "notepads",
  "notepads": "notepads",
  "memo-pad": "notepads",
  "file-folder": "files-folders",
  "files-folders": "files-folders",
  "folders": "files-folders",
  "folder": "files-folders",
  "certificate": "certificates",
  "certificates": "certificates",
  "award-certificates": "certificates",
  "id-card": "id-cards",
  "id-cards": "id-cards",
  "identity-card": "id-cards",
  "pvc-id": "id-cards",

  // Wedding & Events
  "wedding-card": "wedding-cards",
  "wedding-cards": "wedding-cards",
  "wedding-invitations": "wedding-cards",
  "invitation-card": "invitation-cards",
  "invitation-cards": "invitation-cards",
  "invitations": "invitation-cards",
  "thank-you-card": "thank-you-cards",
  "thank-you-cards": "thank-you-cards",
  "thank-you": "thank-you-cards",
  "event-ticket": "event-tickets",
  "event-tickets": "event-tickets",
  "ticket": "event-tickets",
  "tickets": "event-tickets",
  "ceremony-program": "ceremony-programs",
  "ceremony-programs": "ceremony-programs",
  "itinerary": "ceremony-programs",
};

export const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  // Legacy / colloquial slugs mapping to canonical slugs
  "business-stationery": "business-printing",
  "marketing-promo": "marketing-materials",
  "large-format": "outdoor-advertising",
  "stickers-labels": "labels-stickers",
  "merchandise-gifts": "photo-custom-printing",
  "corporate-gifts": "photo-custom-printing",
  "gifts": "photo-custom-printing",
  "apparel": "photo-custom-printing",
  "art-prints": "photo-custom-printing",
  "photo-custom": "photo-custom-printing",
  // Canonical categories
  "business-printing": "business-printing",
  "marketing-materials": "marketing-materials",
  "outdoor-advertising": "outdoor-advertising",
  "stationery": "stationery",
  "wedding-events": "wedding-events",
  "packaging": "packaging",
  "labels-stickers": "labels-stickers",
  "photo-custom-printing": "photo-custom-printing",
};

// Helper queries
export function getAllProducts(): CatalogProduct[] {
  return CATALOG_PRODUCTS;
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim();
  const targetSlug = PRODUCT_SLUG_ALIASES[normalized] || normalized;
  return CATALOG_PRODUCTS.find((p) => p.slug === targetSlug);
}

export function getCategoryRedirect(slug: string): string | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim();
  return CATEGORY_SLUG_ALIASES[normalized];
}

export function getProductsByCategory(categorySlug: string): CatalogProduct[] {
  if (!categorySlug || categorySlug === "all") return CATALOG_PRODUCTS;
  return CATALOG_PRODUCTS.filter((p) => p.categorySlug === categorySlug);
}

export function getFeaturedProducts(): CatalogProduct[] {
  return CATALOG_PRODUCTS.filter((p) => p.isFeatured || p.isBestSeller);
}

export function getAllCategories(): CatalogCategory[] {
  return CATALOG_CATEGORIES;
}

export function getCategoryBySlug(slug: string): CatalogCategory | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim();
  const targetSlug = CATEGORY_SLUG_ALIASES[normalized] || normalized;
  return CATALOG_CATEGORIES.find((c) => c.slug === targetSlug);
}
