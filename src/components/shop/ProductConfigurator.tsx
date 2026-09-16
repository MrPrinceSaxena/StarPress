"use client";

import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Check,
  Zap,
  ShieldCheck,
  MessageCircle,
  Truck,
  Sparkles,
  Info,
} from "lucide-react";
import { CatalogProduct } from "@/lib/catalog";
import { calculateProductPrice, formatINR } from "@/lib/pricing";
import { useCart } from "@/context/CartContext";
import { WHATSAPP_NUMBER } from "@/lib/data";
import Button from "@/components/ui/Button";

export interface ProductConfiguratorProps {
  product: CatalogProduct;
}

export default function ProductConfigurator({ product }: ProductConfiguratorProps) {
  const { addItem } = useCart();

  // Initial option selections
  const defaultSize = product.sizeOptions.find((s) => s.default) || product.sizeOptions[0];
  const defaultMaterial = product.materialOptions.find((m) => m.default) || product.materialOptions[0];
  const defaultQtyTier = product.quantityTiers.find((q) => q.default) || product.quantityTiers[0];

  const [sizeId, setSizeId] = useState<string>(defaultSize?.id || "");
  const [materialId, setMaterialId] = useState<string>(defaultMaterial?.id || "");
  const [quantity, setQuantity] = useState<number>(defaultQtyTier?.quantity || 100);
  const [customText, setCustomText] = useState<string>("");
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // Dynamic real-time price calculation via pricing engine
  const pricing = useMemo(() => {
    return calculateProductPrice(product, {
      sizeId,
      materialId,
      quantity,
      customText,
    });
  }, [product, sizeId, materialId, quantity, customText]);

  const selectedSize = product.sizeOptions.find((s) => s.id === sizeId);
  const selectedMaterial = product.materialOptions.find((m) => m.id === materialId);

  const handleAddToCart = () => {
    addItem(
      {
        id: `${product.id}-${sizeId}-${materialId}-${quantity}`,
        name: `${product.name} (${selectedSize?.label || "Standard"})`,
        price: pricing.unitPrice,
        imageSrc: product.images[0] || "/images/hero-composition.jpg",
        href: `/shop/${product.slug}`,
      },
      quantity
    );

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hi Star Press, I want a quote for ${product.name}:\n- Size: ${selectedSize?.label || "Standard"}\n- Material: ${selectedMaterial?.label || "Default"}\n- Quantity: ${quantity} units\n- Total: ${pricing.formattedTotalPrice}`
  );

  return (
    <div className="space-y-8">
      {/* 1. Size Selection */}
      {product.sizeOptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-display font-bold text-sm text-text-primary uppercase tracking-wider">
              1. Choose Size
            </label>
            {selectedSize?.dimensions && (
              <span className="text-xs text-brand-cyan font-mono">
                {selectedSize.dimensions}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {product.sizeOptions.map((size) => {
              const isSelected = size.id === sizeId;
              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setSizeId(size.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-bg-surface-alt border-brand-cyan shadow-md shadow-brand-cyan/15 text-white"
                      : "bg-bg-surface border-border-subtle hover:border-white/30 text-text-secondary hover:text-white"
                  }`}
                >
                  <span className="text-xs sm:text-sm font-semibold">{size.label}</span>
                  {size.multiplier > 1 && (
                    <span className="text-[11px] font-mono text-brand-cyan bg-brand-cyan/10 px-1.5 py-0.5 rounded">
                      +{Math.round((size.multiplier - 1) * 100)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Material / Paper Selection */}
      {product.materialOptions.length > 0 && (
        <div className="space-y-3">
          <label className="font-display font-bold text-sm text-text-primary uppercase tracking-wider">
            2. Choose Paper Stock & Finish
          </label>

          <div className="space-y-2.5">
            {product.materialOptions.map((mat) => {
              const isSelected = mat.id === materialId;
              return (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => setMaterialId(mat.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-bg-surface-alt border-brand-magenta shadow-md shadow-brand-magenta/15 text-white"
                      : "bg-bg-surface border-border-subtle hover:border-white/30 text-text-secondary hover:text-white"
                  }`}
                >
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-white">
                      {mat.label}
                    </div>
                    {mat.description && (
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {mat.description}
                      </div>
                    )}
                  </div>

                  {mat.extraPricePerUnit > 0 ? (
                    <span className="text-xs font-mono text-brand-magenta bg-brand-magenta/10 px-2 py-0.5 rounded">
                      +₹{mat.extraPricePerUnit}/unit
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-text-muted">Included</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Quantity Tiers & Bulk Discounts */}
      {product.quantityTiers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-display font-bold text-sm text-text-primary uppercase tracking-wider">
              3. Select Quantity Slab
            </label>
            <span className="text-xs text-text-secondary">Higher volume = Lower unit cost</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {product.quantityTiers.map((tier) => {
              const isSelected = tier.quantity === quantity;
              return (
                <button
                  key={tier.quantity}
                  type="button"
                  onClick={() => setQuantity(tier.quantity)}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-bg-surface-alt border-brand-yellow shadow-md shadow-brand-yellow/15 text-white scale-[1.02]"
                      : "bg-bg-surface border-border-subtle hover:border-white/30 text-text-secondary hover:text-white"
                  }`}
                >
                  {tier.discountPercent > 0 && (
                    <span className="absolute -top-2 text-[10px] font-black px-1.5 py-0.2 rounded-full bg-brand-magenta text-white shadow">
                      -{tier.discountPercent}%
                    </span>
                  )}
                  <span className="text-base font-display font-bold text-white mt-1">
                    {tier.quantity.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-text-muted">units</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Custom Text / Personalization (If Applicable) */}
      {product.customizationRules?.hasCustomText && (
        <div className="space-y-2.5 p-4 rounded-xl border border-border-subtle bg-bg-surface">
          <div className="flex items-center justify-between">
            <label className="font-display font-bold text-xs text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-yellow" />
              <span>Custom Text / Inscription</span>
            </label>
            <span className="text-[11px] text-text-muted">
              {customText.length} characters
            </span>
          </div>

          <input
            type="text"
            placeholder="Type your name, phone, slogan, or custom quote..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full bg-bg-surface-alt border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-yellow transition-colors"
          />

          <p className="text-[11px] text-text-secondary flex items-center gap-1">
            <Info size={12} />
            <span>
              First {product.customizationRules.freeCharLimit || 20} characters are free. Extra characters are ₹{product.customizationRules.textPricePerChar || 2}/char.
            </span>
          </p>
        </div>
      )}

      {/* 5. Live Pricing Card & Add to Cart */}
      <div className="p-6 rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-surface via-bg-surface-alt to-bg-surface shadow-2xl space-y-5">
        {/* Unit Price and Total */}
        <div className="flex items-end justify-between pb-4 border-b border-border-subtle">
          <div>
            <div className="text-xs text-text-muted">Total Estimated Price</div>
            <div className="text-3xl sm:text-4xl font-display font-black text-brand-yellow tracking-tight">
              {pricing.formattedTotalPrice}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Effective unit rate:{" "}
              <span className="font-mono text-white font-semibold">
                {pricing.formattedUnitPrice} / unit
              </span>
            </div>
          </div>

          {pricing.discountAmount > 0 && (
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                <span>Save {formatINR(pricing.discountAmount)}</span>
              </span>
              <div className="text-[11px] text-text-muted mt-1">
                ({pricing.discountPercent}% bulk discount)
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleAddToCart}
            className="w-full !py-3.5 !text-base font-bold shadow-xl shadow-brand-yellow/15"
          >
            {isAdded ? (
              <div className="flex items-center gap-2">
                <Check size={18} className="text-black stroke-[3]" />
                <span>Added {quantity} Units to Cart!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-black stroke-[2.5]" />
                <span>Add {quantity} Units to Cart</span>
              </div>
            )}
          </Button>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-bold transition-all"
          >
            <MessageCircle size={17} />
            <span>Chat on WhatsApp for Custom Specs</span>
          </a>
        </div>

        {/* Confidence micro-badges */}
        <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-brand-yellow shrink-0" />
            <span>Ships in {pricing.estimatedTurnaroundDays} business days</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-brand-cyan shrink-0" />
            <span>Free digital PDF proofing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck size={14} className="text-brand-magenta shrink-0" />
            <span>Pan-India insured courier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-brand-yellow shrink-0" />
            <span>100% Quality Checked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
