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

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  // ==========================================
  // 1. Business Printing
  // ==========================================
  {
    id: "prod-business-cards",
    slug: "business-cards",
    name: "Premium Business Cards",
    categorySlug: "business-printing",
    categoryName: "Business Printing",
    shortDescription: "Ultra-thick, velvet-touch visiting cards with crisp typography and optional rounded corners.",
    description: "Our Premium Business Cards are printed on sturdy 350+ GSM cardstock with rich color reproduction. Choose from luxury matte lamination, gloss finish, or soft-touch velvet coatings. Perfect for corporate founders, real estate consultants, and creative professionals.",
    basePrice: 299,
    rating: 4.8,
    reviewCount: 320,
    images: ["/images/prod-business-cards.jpg", "/images/cat-business-cards.jpg"],
    isFeatured: true,
    isBestSeller: true,
    tags: ["Visiting Cards", "Corporate", "Matte Finish", "Quick Dispatch"],
    sizeOptions: [
      { id: "std", label: "Standard (89 x 51 mm)", dimensions: "89 x 51 mm", multiplier: 1.0, default: true },
      { id: "square", label: "Square (65 x 65 mm)", dimensions: "65 x 65 mm", multiplier: 1.15 },
      { id: "rounded", label: "Rounded Corner Standard", dimensions: "89 x 51 mm", multiplier: 1.25 },
    ],
    materialOptions: [
      { id: "matte-350", label: "350 GSM Classic Matte", description: "Smooth anti-glare finish", extraPricePerUnit: 0, default: true },
      { id: "gloss-350", label: "350 GSM Gloss Lamination", description: "Vibrant and punchy shine", extraPricePerUnit: 0.2 },
      { id: "velvet-400", label: "400 GSM Soft-Touch Velvet", description: "Ultra-premium suede feel", extraPricePerUnit: 0.6 },
    ],
    quantityTiers: [
      { quantity: 100, discountPercent: 0, default: true },
      { quantity: 250, discountPercent: 12 },
      { quantity: 500, discountPercent: 22 },
      { quantity: 1000, discountPercent: 35 },
    ],
    customizationRules: {
      hasCustomText: true,
      textPricePerChar: 1,
      freeCharLimit: 30,
      hasFileUpload: true,
      uploadInstructions: "Upload PDF or AI format with 3mm bleed margin.",
    },
    specifications: {
      "Stock Weight": "350 – 400 GSM Board",
      "Print Quality": "Indigo Digital Offset 2400 DPI",
      "Corners": "Square or 6mm Die-Cut Radius",
      "Standard Turnaround": "24 to 48 Hours",
      "Shipping": "Pan-India Courier Dispatch",
    },
    features: [
      "Precision die-cut edges with zero scuffing",
      "Fade-resistant pigmented inks",
      "Double-sided full color printing included",
      "Free digital PDF pre-press review",
    ],
  },
  {
    id: "prod-letterheads",
    slug: "letterheads",
    name: "Corporate Letterheads",
    categorySlug: "business-printing",
    categoryName: "Business Printing",
    shortDescription: "Laser and inkjet-friendly corporate letterheads with sharp official logos.",
    description: "Standardize your corporate correspondence. High-grade 100 GSM Alabaster paper ensures smooth feeding through desktop office laser printers without ink bleeding.",
    basePrice: 449,
    rating: 4.7,
    reviewCount: 94,
    images: ["/images/cat-business-cards.jpg"],
    tags: ["Corporate", "Official Documents", "A4 Paper"],
    sizeOptions: [
      { id: "a4", label: "Standard A4 (210 x 297 mm)", multiplier: 1.0, default: true },
    ],
    materialOptions: [
      { id: "bond-100", label: "100 GSM Executive Bond Paper", extraPricePerUnit: 0, default: true },
      { id: "dox-120", label: "120 GSM Royal Textured Paper", extraPricePerUnit: 0.5 },
    ],
    quantityTiers: [
      { quantity: 100, discountPercent: 0, default: true },
      { quantity: 250, discountPercent: 15 },
      { quantity: 500, discountPercent: 25 },
      { quantity: 1000, discountPercent: 38 },
    ],
    specifications: {
      "Dimensions": "210 x 297 mm (A4)",
      "Paper": "100 - 120 GSM Bond",
      "Printer Compatibility": "Laser & Inkjet Friendly",
      "Turnaround": "48 Hours",
    },
    features: ["Smooth writing surface", "Vibrant company logo reproduction", "Printer-safe formulation"],
  },
  {
    id: "prod-envelopes",
    slug: "envelopes",
    name: "Custom Printed Envelopes",
    categorySlug: "business-printing",
    categoryName: "Business Printing",
    shortDescription: "Peel-and-seal branded envelopes in standard business and greeting sizes.",
    description: "Send invoices, invitations, and letters inside branded self-adhesive envelopes. Moisture-resistant glue strip ensures tamper-evident mailing.",
    basePrice: 399,
    rating: 4.6,
    reviewCount: 68,
    images: ["/images/cat-business-cards.jpg"],
    tags: ["Envelopes", "Mailing", "Corporate"],
    sizeOptions: [
      { id: "env-dl", label: "DL Size (110 x 220 mm)", multiplier: 1.0, default: true },
      { id: "env-c5", label: "C5 Size (162 x 229 mm)", multiplier: 1.3 },
      { id: "env-c4", label: "C4 Size for A4 flat (229 x 324 mm)", multiplier: 1.7 },
    ],
    materialOptions: [
      { id: "paper-100", label: "100 GSM Maplitho Paper", extraPricePerUnit: 0, default: true },
      { id: "kraft-120", label: "120 GSM Golden Kraft Paper", extraPricePerUnit: 0.4 },
    ],
    quantityTiers: [
      { quantity: 100, discountPercent: 0, default: true },
      { quantity: 250, discountPercent: 10 },
      { quantity: 500, discountPercent: 20 },
      { quantity: 1000, discountPercent: 32 },
    ],
    specifications: { "Closure": "Peel & Seal Adhesive Strip", "Print": "Full Color Face Print" },
    features: ["Strong adhesive peel-and-seal", "Security tint inside available"],
  },
  {
    id: "prod-invoice-books",
    slug: "invoice-books",
    name: "Bill Books & Invoice Books",
    categorySlug: "business-printing",
    categoryName: "Business Printing",
    shortDescription: "Numbered duplicate and triplicate carbonless NCR bill books with perforation.",
    description: "Custom printed carbonless copy books. Includes sequentially numbered pages, clean tear-off perforations, and sturdy hardboard binding.",
    basePrice: 599,
    rating: 4.9,
    reviewCount: 142,
    images: ["/images/cat-business-cards.jpg"],
    tags: ["Bill Books", "Invoices", "NCR Carbonless"],
    sizeOptions: [
      { id: "a5", label: "A5 Half Size (148 x 210 mm)", multiplier: 1.0, default: true },
      { id: "a4", label: "A4 Full Size (210 x 297 mm)", multiplier: 1.6 },
    ],
    materialOptions: [
      { id: "ncr-duplicate", label: "Duplicate (1+1 White/Pink)", extraPricePerUnit: 0, default: true },
      { id: "ncr-triplicate", label: "Triplicate (1+1+1 White/Yellow/Pink)", extraPricePerUnit: 1.2 },
    ],
    quantityTiers: [
      { quantity: 5, discountPercent: 0, default: true },
      { quantity: 10, discountPercent: 15 },
      { quantity: 25, discountPercent: 28 },
      { quantity: 50, discountPercent: 38 },
    ],
    specifications: { "Pages per book": "50 sets (100 leaves)", "Numbering": "Sequential Red Ink" },
    features: ["No carbon paper required (NCR)", "Micro-perforated tear lines", "Durable wrap-around shield"],
  },
  {
    id: "prod-company-profiles",
    slug: "company-profiles",
    name: "Company Profile Booklets",
    categorySlug: "business-printing",
    categoryName: "Business Printing",
    shortDescription: "Saddle-stitched corporate overview brochures for investor and client presentations.",
    description: "Showcase your company achievements, services, and vision with premium multi-page booklets bound with precision wire stitching.",
    basePrice: 899,
    rating: 4.8,
    reviewCount: 52,
    images: ["/images/cat-brochures.jpg"],
    tags: ["Brochure", "Company Profile", "Corporate"],
    sizeOptions: [
      { id: "a4", label: "A4 Portrait", multiplier: 1.0, default: true },
      { id: "square", label: "Square (210 x 210 mm)", multiplier: 1.1 },
    ],
    materialOptions: [
      { id: "inner-170", label: "250 GSM Cover + 170 GSM Gloss Pages", extraPricePerUnit: 0, default: true },
      { id: "inner-matte", label: "300 GSM Cover + 170 GSM Velvet Matte", extraPricePerUnit: 1.5 },
    ],
    quantityTiers: [
      { quantity: 25, discountPercent: 0, default: true },
      { quantity: 50, discountPercent: 12 },
      { quantity: 100, discountPercent: 25 },
      { quantity: 250, discountPercent: 35 },
    ],
    specifications: { "Binding": "Center Saddle-Stitch", "Pages": "8 to 16 Pages" },
    features: ["Laminated heavy front cover", "High definition image clarity"],
  },

  // ==========================================
  // 2. Marketing Materials
  // ==========================================
  {
    id: "prod-a4-flyers",
    slug: "a4-flyers",
    name: "A4 Marketing Flyers",
    categorySlug: "marketing-materials",
    categoryName: "Marketing Materials",
    shortDescription: "High-volume promotional flyers with vivid photographic fidelity.",
    description: "Drive foot traffic and sales conversions with crisp, vibrant full-color flyers. Ideal for product launches, event hand-outs, food menus, and retail promotions.",
    basePrice: 499,
    rating: 4.6,
    reviewCount: 188,
    images: ["/images/prod-flyers.jpg", "/images/cat-flyers.jpg"],
    isFeatured: true,
    isBestSeller: true,
    tags: ["Flyers", "Leaflets", "Marketing", "Bulk Promotion"],
    sizeOptions: [
      { id: "a4", label: "A4 (210 x 297 mm)", multiplier: 1.0, default: true },
      { id: "a5", label: "A5 (148 x 210 mm)", multiplier: 0.65 },
      { id: "a6", label: "A6 Postcard (105 x 148 mm)", multiplier: 0.45 },
    ],
    materialOptions: [
      { id: "art-130", label: "130 GSM Gloss Art Paper", description: "Lightweight promotional flyer", extraPricePerUnit: 0, default: true },
      { id: "art-170", label: "170 GSM Heavy Art Paper", description: "Premium, no show-through", extraPricePerUnit: 0.3 },
      { id: "card-250", label: "250 GSM Cardstock", description: "Rigid luxury handout", extraPricePerUnit: 0.8 },
    ],
    quantityTiers: [
      { quantity: 250, discountPercent: 0, default: true },
      { quantity: 500, discountPercent: 18 },
      { quantity: 1000, discountPercent: 32 },
      { quantity: 2500, discountPercent: 44 },
    ],
    specifications: {
      "Finish": "Gloss / Matte Coated",
      "Colors": "Double-Sided 4-Color CMYK",
      "Bleed": "3mm Safe Zone",
    },
    features: ["Sharp text and vibrant saturated graphics", "Double-sided full bleed printing", "Fast 24-hr batching options"],
  },
  {
    id: "prod-brochures",
    slug: "brochures",
    name: "Tri-Fold Brochures",
    categorySlug: "marketing-materials",
    categoryName: "Marketing Materials",
    shortDescription: "Compact, informative folded brochures for menus, product guides, and expos.",
    description: "Compact tri-fold brochures offer 6 panels of organized real estate for storytelling, service breakdowns, and promotional pricing.",
    basePrice: 599,
    rating: 4.7,
    reviewCount: 112,
    images: ["/images/cat-brochures.jpg"],
    isFeatured: true,
    isBestSeller: true,
    tags: ["Brochures", "Tri-Fold", "Pamphlets", "Menus"],
    sizeOptions: [
      { id: "trifold-a4", label: "A4 Tri-Fold (Folded to 100 x 210 mm)", multiplier: 1.0, default: true },
      { id: "bifold-a4", label: "A4 Bi-Fold (Folded to 148 x 210 mm)", multiplier: 1.0 },
      { id: "trifold-a3", label: "A3 Tri-Fold Large Format", multiplier: 1.7 },
    ],
    materialOptions: [
      { id: "art-170", label: "170 GSM Silk Finish Paper", extraPricePerUnit: 0, default: true },
      { id: "art-250", label: "250 GSM Sturdy Cardstock", extraPricePerUnit: 0.5 },
    ],
    quantityTiers: [
      { quantity: 100, discountPercent: 0, default: true },
      { quantity: 250, discountPercent: 15 },
      { quantity: 500, discountPercent: 28 },
      { quantity: 1000, discountPercent: 40 },
    ],
    specifications: { "Folding": "Roll Fold or Z-Fold Machine Creased", "Panels": "6 Display Panels" },
    features: ["Machine-scored fold lines prevent paper cracking", "Vibrant colors on all panels"],
  },
  {
    id: "prod-posters",
    slug: "posters",
    name: "High-Gloss Posters",
    categorySlug: "marketing-materials",
    categoryName: "Marketing Materials",
    shortDescription: "Large format promotional posters for storefront windows and venue walls.",
    description: "Eye-catching posters printed on premium photo gloss paper with rich blacks and deep contrast.",
    basePrice: 349,
    rating: 4.8,
    reviewCount: 76,
    images: ["/images/cat-flyers.jpg"],
    tags: ["Posters", "Events", "Storefront"],
    sizeOptions: [
      { id: "a3", label: "A3 (297 x 420 mm)", multiplier: 1.0, default: true },
      { id: "a2", label: "A2 (420 x 594 mm)", multiplier: 1.8 },
      { id: "a1", label: "A1 (594 x 841 mm)", multiplier: 3.2 },
    ],
    materialOptions: [
      { id: "gloss-200", label: "200 GSM Photo Gloss", extraPricePerUnit: 0, default: true },
      { id: "matte-200", label: "200 GSM Matte Architectural", extraPricePerUnit: 0.2 },
    ],
    quantityTiers: [
      { quantity: 10, discountPercent: 0, default: true },
      { quantity: 25, discountPercent: 15 },
      { quantity: 50, discountPercent: 25 },
      { quantity: 100, discountPercent: 38 },
    ],
    specifications: { "Inks": "UV Fade-Resistant 8-Color Pigment", "Resolution": "2400 DPI" },
    features: ["Brilliant photographic contrast", "Delivered rolled in protective hard tubes"],
  },

  // ==========================================
  // 3. Outdoor Advertising
  // ==========================================
  {
    id: "prod-vinyl-banner",
    slug: "vinyl-banners",
    name: "Heavy-Duty Vinyl Banners",
    categorySlug: "outdoor-advertising",
    categoryName: "Outdoor Advertising",
    shortDescription: "Weatherproof flex and vinyl banners with brass eyelets for outdoor display.",
    description: "Constructed from 440+ GSM reinforced vinyl with heat-welded hems and rust-resistant brass grommets. Resists wind, torrential rain, and UV fading for over 2 years outdoors.",
    basePrice: 899,
    rating: 4.7,
    reviewCount: 96,
    images: ["/images/prod-banner.jpg", "/images/cat-banners.jpg"],
    isFeatured: true,
    isBestSeller: true,
    tags: ["Flex Banner", "Vinyl", "Outdoor", "Waterproof"],
    sizeOptions: [
      { id: "banner-6x3", label: "6 x 3 Feet (Standard)", multiplier: 1.0, default: true },
      { id: "banner-8x4", label: "8 x 4 Feet", multiplier: 1.7 },
      { id: "banner-10x5", label: "10 x 5 Feet", multiplier: 2.6 },
      { id: "banner-12x6", label: "12 x 6 Feet (Billboard style)", multiplier: 3.8 },
    ],
    materialOptions: [
      { id: "vinyl-440", label: "440 GSM Standard Flex", extraPricePerUnit: 0, default: true },
      { id: "vinyl-540", label: "540 GSM Heavy-Duty Star Blockout", extraPricePerUnit: 150 },
    ],
    quantityTiers: [
      { quantity: 1, discountPercent: 0, default: true },
      { quantity: 3, discountPercent: 12 },
      { quantity: 5, discountPercent: 20 },
      { quantity: 10, discountPercent: 30 },
    ],
    specifications: {
      "Material": "440 – 540 GSM PVC Tarpaulin",
      "Reinforcement": "Heat-welded 1-inch hem on all 4 sides",
      "Grommets": "Brass eyelets every 2 feet",
      "UV Durability": "2+ Years Outdoor Grade",
    },
    features: [
      "100% waterproof and tear-proof",
      "Free reinforced brass eyelets around perimeter",
      "Resistant to fading under intense sunlight",
    ],
  },
  {
    id: "prod-standees",
    slug: "standees",
    name: "Roll-Up Standee Banners",
    categorySlug: "outdoor-advertising",
    categoryName: "Outdoor Advertising",
    shortDescription: "Portable aluminum roll-up pull-up display stands with custom printed banner.",
    description: "Set up in 30 seconds at exhibitions, shop entrances, and conference booths. Includes lightweight aluminum base, collapsible support pole, and free carry bag.",
    basePrice: 1299,
    rating: 4.8,
    reviewCount: 64,
    images: ["/images/cat-banners.jpg"],
    tags: ["Standee", "Exhibitions", "Roll-Up", "Portable"],
    sizeOptions: [
      { id: "standee-6x2_5", label: "6 x 2.5 Feet (Standard Expo)", multiplier: 1.0, default: true },
      { id: "standee-6x3", label: "6 x 3 Feet (Wide Display)", multiplier: 1.25 },
    ],
    materialOptions: [
      { id: "star-matte", label: "Non-Tear Star Flex Fabric", extraPricePerUnit: 0, default: true },
      { id: "poly-satin", label: "Premium Polyester Satin Fabric", extraPricePerUnit: 350 },
    ],
    quantityTiers: [
      { quantity: 1, discountPercent: 0, default: true },
      { quantity: 2, discountPercent: 10 },
      { quantity: 5, discountPercent: 18 },
      { quantity: 10, discountPercent: 28 },
    ],
    specifications: { "Base": "Sturdy Anodized Aluminum Mechanism", "Package": "Includes Padded Travel Carry Bag" },
    features: ["Retractable pull-up mechanism", "Assembles in 30 seconds with no tools", "High resolution scratch-free graphic"],
  },
  {
    id: "prod-glow-signs",
    slug: "glow-sign-boards",
    name: "LED Glow Signboards",
    categorySlug: "outdoor-advertising",
    categoryName: "Outdoor Advertising",
    shortDescription: "Backlit LED aluminum lightbox boards with vibrant day-and-night storefront presence.",
    description: "Custom backlit signage fabricated with powder-coated aluminum framing, internal water-sealed LED modules, and heavy backlit flex graphic.",
    basePrice: 2999,
    rating: 4.9,
    reviewCount: 41,
    images: ["/images/cat-banners.jpg"],
    tags: ["Glow Sign", "LED", "Storefront", "Signboard"],
    sizeOptions: [
      { id: "glow-4x2", label: "4 x 2 Feet", multiplier: 1.0, default: true },
      { id: "glow-6x3", label: "6 x 3 Feet", multiplier: 2.1 },
      { id: "glow-8x4", label: "8 x 4 Feet", multiplier: 3.6 },
    ],
    materialOptions: [
      { id: "led-single", label: "Single-Sided Wall Mount", extraPricePerUnit: 0, default: true },
      { id: "led-double", label: "Double-Sided Projecting Bracket", extraPricePerUnit: 800 },
    ],
    quantityTiers: [
      { quantity: 1, discountPercent: 0, default: true },
      { quantity: 2, discountPercent: 8 },
      { quantity: 5, discountPercent: 15 },
    ],
    specifications: { "Lighting": "Waterproof IP67 LED Modules", "Frame": "Rust-Free GI / Aluminum Box" },
    features: ["Bright uniform illumination without dark spots", "Low power consumption LEDs", "Full installation bracket kit included"],
  },

  // ==========================================
  // 4. Stationery
  // ==========================================
  {
    id: "prod-notebooks",
    slug: "notebooks",
    name: "Custom Branded Notebooks",
    categorySlug: "stationery",
    categoryName: "Stationery",
    shortDescription: "Spiral and hardbound custom printed journals with company branding on covers.",
    description: "Give employees and clients a practical, high-value desk companion. Features custom full-color laminated cover and 80 GSM smooth ruled pages.",
    basePrice: 199,
    rating: 4.8,
    reviewCount: 88,
    images: ["/images/cat-brochures.jpg"],
    tags: ["Notebooks", "Corporate Gifting", "Stationery"],
    sizeOptions: [
      { id: "a5", label: "A5 Standard Notebook", multiplier: 1.0, default: true },
      { id: "b5", label: "B5 Executive Journal", multiplier: 1.3 },
    ],
    materialOptions: [
      { id: "wiro", label: "Black Twin-Loop Wiro Bound", extraPricePerUnit: 0, default: true },
      { id: "hardcover", label: "Rigid Casebound Hardcover", extraPricePerUnit: 80 },
    ],
    quantityTiers: [
      { quantity: 25, discountPercent: 0, default: true },
      { quantity: 50, discountPercent: 15 },
      { quantity: 100, discountPercent: 25 },
      { quantity: 250, discountPercent: 36 },
    ],
    specifications: { "Pages": "160 Ruled Pages (80 Sheets)", "Paper": "80 GSM Natural Shade" },
    features: ["Fountain-pen friendly paper", "Durable scratch-proof lamination on covers"],
  },
  {
    id: "prod-id-cards",
    slug: "id-cards",
    name: "Employee PVC ID Cards & Lanyards",
    categorySlug: "stationery",
    categoryName: "Stationery",
    shortDescription: "Durable high-gloss PVC cards with custom printed satin lanyards.",
    description: "Credit-card style plastic employee ID badges printed in high definition with employee photos, QR codes, and company logos. Comes with satin lanyards.",
    basePrice: 89,
    rating: 4.7,
    reviewCount: 130,
    images: ["/images/cat-brochures.jpg"],
    tags: ["ID Cards", "Lanyards", "Corporate", "PVC"],
    sizeOptions: [
      { id: "cr80", label: "Standard CR80 (85.6 x 54 mm)", multiplier: 1.0, default: true },
    ],
    materialOptions: [
      { id: "pvc-std", label: "0.8mm Solid PVC with Metal Clip", extraPricePerUnit: 0, default: true },
      { id: "pvc-lanyard", label: "PVC + Custom Printed 20mm Satin Lanyard", extraPricePerUnit: 40 },
    ],
    quantityTiers: [
      { quantity: 10, discountPercent: 0, default: true },
      { quantity: 25, discountPercent: 12 },
      { quantity: 50, discountPercent: 22 },
      { quantity: 100, discountPercent: 35 },
    ],
    specifications: { "Thickness": "800 Micron Solid Plastic", "Durability": "Waterproof & Scratch Proof" },
    features: ["Barcode and RFID chip compatible", "Full color photographic printing on both sides"],
  },

  // ==========================================
  // 5. Wedding & Events
  // ==========================================
  {
    id: "prod-wedding-cards",
    slug: "wedding-cards",
    name: "Luxury Foil Wedding Invitations",
    categorySlug: "wedding-events",
    categoryName: "Wedding & Events",
    shortDescription: "Gold foil and embossed designer marriage cards on imported handmade paper.",
    description: "Celebrate sacred unions in regal style. Handcrafted with metallic gold/rose-gold foil stamping, deep letterpress embossing, and matching designer envelopes.",
    basePrice: 799,
    rating: 4.9,
    reviewCount: 164,
    images: ["/images/cat-stickers.jpg"],
    tags: ["Wedding Cards", "Luxury", "Gold Foil", "Invitations"],
    sizeOptions: [
      { id: "wed-royal", label: "Royal Fold (7 x 5 Inches)", multiplier: 1.0, default: true },
      { id: "wed-grand", label: "Grand Box Invite (8 x 6 Inches)", multiplier: 1.6 },
    ],
    materialOptions: [
      { id: "card-pearl", label: "350 GSM Shimmer Pearl Paper", extraPricePerUnit: 0, default: true },
      { id: "card-velvet", label: "450 GSM Velvet Touch + Real Gold Foil", extraPricePerUnit: 25 },
    ],
    quantityTiers: [
      { quantity: 50, discountPercent: 0, default: true },
      { quantity: 100, discountPercent: 12 },
      { quantity: 200, discountPercent: 24 },
      { quantity: 500, discountPercent: 36 },
    ],
    specifications: { "Finishing": "Real Metallic Foil Stamping", "Accessories": "Includes Envelope & Monogram Seal" },
    features: ["Gleaming metallic foil highlights", "Free digital proof with wedding ceremony texts"],
  },

  // ==========================================
  // 6. Packaging
  // ==========================================
  {
    id: "prod-paper-bags",
    slug: "custom-paper-bags",
    name: "Custom Printed Paper Bags",
    categorySlug: "packaging",
    categoryName: "Packaging",
    shortDescription: "Eco-friendly retail shopping bags with twisted paper and rope handles.",
    description: "Elevate your boutique, jewelry store, or corporate gifting unboxing experience. Built with heavy kraft and white paper boards with reinforced bottoms and rope handles.",
    basePrice: 699,
    rating: 4.8,
    reviewCount: 84,
    images: ["/images/cat-gifts.jpg"],
    isFeatured: true,
    isBestSeller: true,
    tags: ["Paper Bags", "Retail", "Eco-Friendly", "Shopping Bags"],
    sizeOptions: [
      { id: "bag-medium", label: "Medium (8 x 10 x 4 Inches)", multiplier: 1.0, default: true },
      { id: "bag-small", label: "Small Boutique (6 x 8 x 3 Inches)", multiplier: 0.8 },
      { id: "bag-large", label: "Large Retail (12 x 15 x 5 Inches)", multiplier: 1.5 },
    ],
    materialOptions: [
      { id: "kraft-brown", label: "150 GSM Recycled Brown Kraft", extraPricePerUnit: 0, default: true },
      { id: "kraft-white", label: "210 GSM Art Card with Gloss/Matte Lamination", extraPricePerUnit: 12 },
    ],
    quantityTiers: [
      { quantity: 50, discountPercent: 0, default: true },
      { quantity: 100, discountPercent: 15 },
      { quantity: 250, discountPercent: 26 },
      { quantity: 500, discountPercent: 38 },
    ],
    specifications: { "Handles": "Twisted Paper or Cotton Rope", "Weight Bearing": "Up to 5 kg" },
    features: ["Reinforced cardboard base and top cuff", "100% recyclable and bio-degradable"],
  },
  {
    id: "prod-packaging-boxes",
    slug: "packaging-boxes",
    name: "Custom Product Boxes & Cartons",
    categorySlug: "packaging",
    categoryName: "Packaging",
    shortDescription: "Folding cartons and rigid product boxes for cosmetic, food, and retail items.",
    description: "Custom-die-cut boxes engineered to your product dimensions. Crisp offset printing with spot UV, embossing, or matte finishes.",
    basePrice: 899,
    rating: 4.7,
    reviewCount: 46,
    images: ["/images/cat-gifts.jpg"],
    tags: ["Boxes", "Packaging", "Cartons"],
    sizeOptions: [
      { id: "box-sm", label: "Small Box (3 x 3 x 3 Inches)", multiplier: 1.0, default: true },
      { id: "box-md", label: "Medium Box (6 x 4 x 3 Inches)", multiplier: 1.4 },
      { id: "box-lg", label: "Large Box (10 x 8 x 4 Inches)", multiplier: 2.2 },
    ],
    materialOptions: [
      { id: "board-350", label: "350 GSM Folding Box Board", extraPricePerUnit: 0, default: true },
      { id: "kraft-rigid", label: "Heavy Corrugated E-Flute Mailer", extraPricePerUnit: 15 },
    ],
    quantityTiers: [
      { quantity: 50, discountPercent: 0, default: true },
      { quantity: 100, discountPercent: 14 },
      { quantity: 250, discountPercent: 25 },
      { quantity: 500, discountPercent: 35 },
    ],
    specifications: { "Closure": "Auto-Lock Bottom or Tuck Flap", "Printing": "Food-Grade Safe Inks" },
    features: ["Shipped flat for compact storage", "Easy snap-lock assembly in seconds"],
  },

  // ==========================================
  // 7. Labels & Stickers
  // ==========================================
  {
    id: "prod-stickers",
    slug: "custom-stickers",
    name: "Die-Cut Vinyl Stickers",
    categorySlug: "labels-stickers",
    categoryName: "Labels & Stickers",
    shortDescription: "Waterproof vinyl stickers precision cut to any shape with UV protective laminate.",
    description: "Individual die-cut vinyl stickers engineered for laptops, tumblers, helmets, and vehicle bumpers. Peel-and-stick with zero adhesive residue.",
    basePrice: 299,
    rating: 4.9,
    reviewCount: 140,
    images: ["/images/prod-stickers.jpg"],
    isFeatured: true,
    isBestSeller: true,
    tags: ["Stickers", "Die-Cut", "Vinyl", "Waterproof"],
    sizeOptions: [
      { id: "stk-2in", label: "2 x 2 Inches (Compact Logo)", multiplier: 1.0, default: true },
      { id: "stk-3in", label: "3 x 3 Inches (Popular Laptop Size)", multiplier: 1.35 },
      { id: "stk-4in", label: "4 x 4 Inches (Large Format)", multiplier: 1.8 },
    ],
    materialOptions: [
      { id: "vinyl-white", label: "Opaque White Vinyl + Gloss Finish", extraPricePerUnit: 0, default: true },
      { id: "vinyl-matte", label: "Opaque White Vinyl + Matte Finish", extraPricePerUnit: 0.1 },
      { id: "vinyl-holo", label: "Holographic Shimmer Vinyl", extraPricePerUnit: 0.8 },
    ],
    quantityTiers: [
      { quantity: 50, discountPercent: 0, default: true },
      { quantity: 100, discountPercent: 15 },
      { quantity: 250, discountPercent: 28 },
      { quantity: 500, discountPercent: 42 },
    ],
    specifications: { "Adhesive": "Strong Removable Acrylic", "Waterproof": "Dishwasher & Weather Safe" },
    features: ["Precision optical contour cutting", "Leaves zero sticky residue on surfaces", "UV protected from sun fading"],
  },
  {
    id: "prod-bottle-labels",
    slug: "bottle-labels",
    name: "Roll Product Bottle Labels",
    categorySlug: "labels-stickers",
    categoryName: "Labels & Stickers",
    shortDescription: "Water and oil-resistant bottle and jar labels on rolls for manual or machine application.",
    description: "Give cosmetics, beverages, sanitizers, and specialty sauces premium shelf presence with moisture-resistant roll stickers.",
    basePrice: 449,
    rating: 4.8,
    reviewCount: 82,
    images: ["/images/prod-stickers.jpg"],
    tags: ["Product Labels", "Roll Stickers", "Cosmetics"],
    sizeOptions: [
      { id: "lbl-3x2", label: "3 x 2 Inches (Standard Bottle)", multiplier: 1.0, default: true },
      { id: "lbl-4x3", label: "4 x 3 Inches (Wide Jar Wrap)", multiplier: 1.4 },
    ],
    materialOptions: [
      { id: "poly-gloss", label: "Gloss BOPP Plastic (Waterproof)", extraPricePerUnit: 0, default: true },
      { id: "kraft-textured", label: "Vintage Textured Paper (Oil Safe)", extraPricePerUnit: 0.3 },
    ],
    quantityTiers: [
      { quantity: 100, discountPercent: 0, default: true },
      { quantity: 250, discountPercent: 18 },
      { quantity: 500, discountPercent: 32 },
      { quantity: 1000, discountPercent: 45 },
    ],
    specifications: { "Format": "Continuous Roll on 3-inch Core", "Resistance": "Oil, Water & Freezer Safe" },
    features: ["Easy-peel liner", "Compatible with automated label dispensers"],
  },

  // ==========================================
  // 8. Photo & Custom Printing
  // ==========================================
  {
    id: "prod-canvas-prints",
    slug: "canvas-prints",
    name: "Museum Gallery Canvas Prints",
    categorySlug: "photo-custom-printing",
    categoryName: "Photo & Custom Printing",
    shortDescription: "Stretched artist canvas mounted on pine wood frames ready to hang.",
    description: "Turn family portraits, travel photography, and artistic paintings into gallery-quality wall art. Hand-stretched over kiln-dried pinewood frames.",
    basePrice: 799,
    rating: 4.9,
    reviewCount: 110,
    images: ["/images/promo-banner.jpg"],
    tags: ["Canvas", "Wall Art", "Photo Prints", "Gifting"],
    sizeOptions: [
      { id: "canv-12x8", label: "12 x 8 Inches (Small)", multiplier: 1.0, default: true },
      { id: "canv-18x12", label: "18 x 12 Inches (Popular)", multiplier: 1.6 },
      { id: "canv-24x16", label: "24 x 16 Inches (Large Statement)", multiplier: 2.5 },
      { id: "canv-36x24", label: "36 x 24 Inches (Gallery Masterpiece)", multiplier: 4.2 },
    ],
    materialOptions: [
      { id: "canvas-poly", label: "380 GSM Cotton Blend Canvas", extraPricePerUnit: 0, default: true },
      { id: "canvas-pure", label: "100% Archival Cotton + Clear Coat", extraPricePerUnit: 200 },
    ],
    quantityTiers: [
      { quantity: 1, discountPercent: 0, default: true },
      { quantity: 2, discountPercent: 10 },
      { quantity: 4, discountPercent: 20 },
      { quantity: 8, discountPercent: 30 },
    ],
    specifications: { "Frame Depth": "0.75-inch Stretcher Pine Bar", "Hanging": "Pre-installed sawtooth hanger" },
    features: ["Wrapped edges with mirrored borders", "UV resistant inks guarantee no fading for 50+ years"],
  },
  {
    id: "prod-mug-printing",
    slug: "mug-printing",
    name: "Custom Ceramic Photo Mugs",
    categorySlug: "photo-custom-printing",
    categoryName: "Photo & Custom Printing",
    shortDescription: "Microwave and dishwasher safe ceramic mugs personalized with photos or logos.",
    description: "Start the day with warm memories. High-grade AAA ceramic mugs sublimation printed with vivid colors that will never peel or wash off.",
    basePrice: 249,
    rating: 4.8,
    reviewCount: 95,
    images: ["/images/promo-banner.jpg"],
    tags: ["Mugs", "Photo Gift", "Corporate Merch"],
    sizeOptions: [
      { id: "mug-11oz", label: "11 oz Standard White Mug", multiplier: 1.0, default: true },
      { id: "mug-magic", label: "11 oz Color Changing Magic Mug", multiplier: 1.6 },
    ],
    materialOptions: [
      { id: "ceramic-std", label: "AAA Grade Gloss Ceramic", extraPricePerUnit: 0, default: true },
    ],
    quantityTiers: [
      { quantity: 1, discountPercent: 0, default: true },
      { quantity: 5, discountPercent: 12 },
      { quantity: 15, discountPercent: 25 },
      { quantity: 50, discountPercent: 40 },
    ],
    customizationRules: {
      hasCustomText: true,
      textPricePerChar: 0,
      freeCharLimit: 50,
      hasFileUpload: true,
      uploadInstructions: "Upload photo (JPG/PNG) at least 1500x800 px for wrap print.",
    },
    specifications: { "Capacity": "330 ml (11 oz)", "Care": "100% Microwave and Dishwasher Safe" },
    features: ["Permanent sublimation dye print", "Delivered in thermocol safety box"],
  },
  {
    id: "prod-t-shirt-printing",
    slug: "t-shirt-printing",
    name: "Custom Branded Cotton T-Shirts",
    categorySlug: "photo-custom-printing",
    categoryName: "Photo & Custom Printing",
    shortDescription: "100% combed cotton biowashed tees with DTF direct-to-film printing.",
    description: "Outfit your team, event attendees, or collegiate society in premium 180 GSM cotton crewneck t-shirts with vibrant, stretch-resistant prints.",
    basePrice: 399,
    rating: 4.7,
    reviewCount: 78,
    images: ["/images/promo-banner.jpg"],
    tags: ["T-Shirts", "Apparel", "DTF Print", "Merchandise"],
    sizeOptions: [
      { id: "size-s", label: "S (38 in)", multiplier: 1.0 },
      { id: "size-m", label: "M (40 in)", multiplier: 1.0, default: true },
      { id: "size-l", label: "L (42 in)", multiplier: 1.0 },
      { id: "size-xl", label: "XL (44 in)", multiplier: 1.0 },
      { id: "size-2xl", label: "2XL (46 in)", multiplier: 1.1 },
    ],
    materialOptions: [
      { id: "cotton-180", label: "180 GSM 100% Biowash Cotton", extraPricePerUnit: 0, default: true },
      { id: "cotton-240", label: "240 GSM Heavyweight Oversized Cotton", extraPricePerUnit: 90 },
    ],
    quantityTiers: [
      { quantity: 1, discountPercent: 0, default: true },
      { quantity: 10, discountPercent: 15 },
      { quantity: 25, discountPercent: 28 },
      { quantity: 100, discountPercent: 42 },
    ],
    customizationRules: {
      hasCustomText: true,
      hasFileUpload: true,
      uploadInstructions: "Transparent PNG format at 300 DPI recommended.",
    },
    specifications: { "Fabric": "100% Ring-Spun Combed Cotton", "Print Tech": "High-Definition DTF Transfer" },
    features: ["Soft feel with no cracking on wash", "Pre-shrunk biowashed comfort fit"],
  },
];

export const PRODUCT_SLUG_ALIASES: Record<string, string> = {
  // Flyers & Leaflets
  "flyers": "a4-flyers",
  "flyer": "a4-flyers",
  "leaflets": "a4-flyers",
  "leaflet": "a4-flyers",
  // Banners & Signage
  "banners": "vinyl-banners",
  "banner": "vinyl-banners",
  "flex-banners": "vinyl-banners",
  // Stickers & Labels
  "stickers": "custom-stickers",
  "sticker": "custom-stickers",
  "die-cut-stickers": "custom-stickers",
  "labels": "bottle-labels",
  "label": "bottle-labels",
  // Mugs & Drinkware
  "custom-mugs": "mug-printing",
  "mugs": "mug-printing",
  "mug": "mug-printing",
  "custom-gifts": "mug-printing",
  // Packaging & Bags
  "packaging": "packaging-boxes",
  "packaging-box": "packaging-boxes",
  "boxes": "packaging-boxes",
  "box": "packaging-boxes",
  "paper-bags": "custom-paper-bags",
  "paper-bag": "custom-paper-bags",
  "bags": "custom-paper-bags",
  // Apparel
  "t-shirts": "t-shirt-printing",
  "t-shirt": "t-shirt-printing",
  "tshirts": "t-shirt-printing",
  "tshirt": "t-shirt-printing",
  "apparel": "t-shirt-printing",
  // Stationery & Cards
  "cards": "business-cards",
  "card": "business-cards",
  "business-card": "business-cards",
  "letterhead": "letterheads",
  "envelope": "envelopes",
  "brochure": "brochures",
  "tri-fold-brochure": "brochures",
  "poster": "posters",
  "standee": "standees",
  "canvas": "canvas-prints",
  "canvas-art": "canvas-prints",
  "id-card": "id-cards",
  "wedding-card": "wedding-cards",
};

export const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  "business-stationery": "business-stationery",
  "business-printing": "business-stationery",
  "stationery": "business-stationery",
  "marketing-promo": "marketing-promo",
  "marketing-materials": "marketing-promo",
  "large-format": "large-format",
  "outdoor-advertising": "large-format",
  "stickers-labels": "stickers-labels",
  "labels-stickers": "stickers-labels",
  "merchandise-gifts": "merchandise-gifts",
  "corporate-gifts": "merchandise-gifts",
  "gifts": "merchandise-gifts",
  "apparel": "apparel",
  "art-prints": "art-prints",
  "photo-custom": "art-prints",
  "wedding-events": "marketing-promo",
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
