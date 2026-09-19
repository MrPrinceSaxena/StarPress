export interface PricingOptions {
  sizeId?: string;
  materialId?: string;
  quantity: number;
  customText?: string;
}

export interface PriceBreakdown {
  basePrice: number;
  unitPrice: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  customizationFee: number;
  totalPrice: number;
  savings: number;
  formattedTotalPrice: string;
  formattedUnitPrice: string;
  estimatedTurnaroundDays: number;
}

export interface CatalogProductPricingConfig {
  basePrice: number;
  pricingModel?: "batch" | "unit";
  baseQuantity?: number;
  sizeOptions: Array<{
    id: string;
    label: string;
    multiplier: number;
    default?: boolean;
  }>;
  materialOptions: Array<{
    id: string;
    label: string;
    extraPricePerUnit: number;
    default?: boolean;
  }>;
  quantityTiers: Array<{
    quantity: number;
    discountPercent: number;
    default?: boolean;
  }>;
  customizationRules?: {
    hasCustomText?: boolean;
    textPricePerChar?: number;
    freeCharLimit?: number;
  };
}

/**
 * Calculates dynamic price based on PRD §6 business rules:
 * - For batch products (cards, flyers, brochures, stickers, stationery): basePrice is for starter batch (default tier qty, e.g. 100 pcs).
 * - For unit products (mugs, t-shirts, canvas prints, banners): basePrice is per individual item.
 */
export function calculateProductPrice(
  config: CatalogProductPricingConfig,
  options: PricingOptions
): PriceBreakdown {
  const {
    basePrice,
    sizeOptions,
    materialOptions,
    quantityTiers,
    customizationRules,
    pricingModel,
    baseQuantity,
  } = config;
  const quantity = Math.max(1, options.quantity);

  // 1. Determine size multiplier
  const selectedSize =
    sizeOptions.find((s) => s.id === options.sizeId) ||
    sizeOptions.find((s) => s.default) ||
    sizeOptions[0] || { multiplier: 1 };
  const sizeMultiplier = selectedSize.multiplier || 1;

  // 2. Determine material extra cost
  const selectedMaterial =
    materialOptions.find((m) => m.id === options.materialId) ||
    materialOptions.find((m) => m.default) ||
    materialOptions[0] || { extraPricePerUnit: 0 };
  const materialExtra = selectedMaterial.extraPricePerUnit || 0;

  // 3. Determine base unit rate
  // Default tier quantity for starter pack
  const defaultTier =
    quantityTiers.find((t) => t.default) || quantityTiers[0] || { quantity: 1 };
  const isBatch =
    pricingModel === "batch" ||
    (pricingModel !== "unit" && defaultTier.quantity >= 10);
  const effectiveBaseQty = baseQuantity || (isBatch ? defaultTier.quantity : 1);
  const baseUnitRate = isBatch ? basePrice / effectiveBaseQty : basePrice;

  // 4. Find closest qualifying quantity discount tier
  const sortedTiers = [...quantityTiers].sort((a, b) => b.quantity - a.quantity);
  const matchedTier = sortedTiers.find((tier) => quantity >= tier.quantity);
  const discountPercent = matchedTier ? matchedTier.discountPercent : 0;

  // 5. Calculate unit price
  const rawUnitPrice = baseUnitRate * sizeMultiplier + materialExtra;
  const discountedUnitPrice = rawUnitPrice * (1 - discountPercent / 100);
  const roundedUnitPrice =
    Math.round(discountedUnitPrice * 100) / 100;

  // 6. Customization fee for engraved/personalized text length
  let customizationFee = 0;
  if (customizationRules?.hasCustomText && options.customText) {
    const freeChars = customizationRules.freeCharLimit ?? 20;
    const ratePerChar = customizationRules.textPricePerChar ?? 2;
    const billableChars = Math.max(0, options.customText.trim().length - freeChars);
    customizationFee = billableChars * ratePerChar;
  }

  // 7. Subtotal & total
  const undiscountedSubtotal = Math.round(rawUnitPrice * quantity);
  const finalSubtotal = Math.round(discountedUnitPrice * quantity);
  const discountAmount = Math.max(0, undiscountedSubtotal - finalSubtotal);
  const totalPrice = finalSubtotal + customizationFee;

  // 8. Estimated turnaround based on volume
  let estimatedTurnaroundDays = 2;
  if (quantity >= 5000) {
    estimatedTurnaroundDays = 5;
  } else if (quantity >= 1000) {
    estimatedTurnaroundDays = 3;
  }

  return {
    basePrice,
    unitPrice: roundedUnitPrice,
    subtotal: finalSubtotal,
    discountPercent,
    discountAmount,
    customizationFee,
    totalPrice,
    savings: discountAmount,
    formattedTotalPrice: formatINR(totalPrice),
    formattedUnitPrice: formatINR(roundedUnitPrice),
    estimatedTurnaroundDays,
  };
}

/**
 * Formats a number to Indian Rupee currency standard: e.g. 1299 -> "₹1,299" or 2.99 -> "₹2.99"
 */
export function formatINR(amount: number): string {
  const isFractional = amount > 0 && amount < 10 && Math.floor(amount) !== amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: isFractional ? 2 : 0,
    minimumFractionDigits: isFractional ? 2 : 0,
  }).format(amount);
}
