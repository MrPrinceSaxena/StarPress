"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";

const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 99;

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, isLoaded } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    setPromoSuccess("");

    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === "STAR10") {
      setAppliedPromo({ code: "STAR10", discountPercent: 10 });
      setPromoSuccess("10% discount applied successfully!");
    } else if (code === "PRESS20") {
      if (subtotal >= 1500) {
        setAppliedPromo({ code: "PRESS20", discountPercent: 20 });
        setPromoSuccess("20% bulk order discount applied!");
      } else {
        setPromoError("Code PRESS20 requires a minimum order of ₹1,500");
      }
    } else {
      setPromoError("Invalid discount code. Try STAR10 for 10% off.");
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoSuccess("");
    setPromoError("");
  };

  // Calculations
  const discountAmount = appliedPromo
    ? Math.round((subtotal * appliedPromo.discountPercent) / 100)
    : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const isFreeShipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = discountedSubtotal > 0 && !isFreeShipping ? STANDARD_SHIPPING_FEE : 0;
  const gstAmount = Math.round(discountedSubtotal * 0.18);
  const grandTotal = discountedSubtotal + gstAmount + shippingFee;

  const amountNeededForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - discountedSubtotal
  );
  const freeShippingProgress = Math.min(
    100,
    Math.round((discountedSubtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 lg:px-10 py-10 md:py-14">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border-subtle">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShoppingBag size={13} className="text-brand-yellow" />
              <span>Review Your Print Order</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
              Shopping Cart
            </h1>
          </div>

          <div className="text-xs text-text-muted flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-white transition-colors">
              Shop
            </Link>
            <span>/</span>
            <span className="text-brand-yellow font-medium">Cart</span>
          </div>
        </div>

        {!isLoaded ? (
          <div className="py-20 text-center text-text-secondary">
            <div className="inline-block w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin mb-4" />
            <p>Loading your cart...</p>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="relative rounded-3xl border border-border-subtle bg-bg-surface p-12 sm:p-20 text-center max-w-2xl mx-auto overflow-hidden shadow-xl my-6">
            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-bg-surface-alt border border-border-subtle flex items-center justify-center mx-auto text-brand-yellow shadow-inner">
                <ShoppingBag size={38} />
              </div>
              <div>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase mb-2">
                  Your Cart Is Empty
                </h2>
                <p className="text-sm text-text-secondary max-w-md mx-auto">
                  Looks like you haven&apos;t added any print products yet. Explore our
                  commercial catalog or launch a custom printing inquiry.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link href="/shop" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full">
                    <span>Explore Shop Catalog</span>
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/custom-printing" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full">
                    <span>Custom Printing</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Active Cart Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-6">
              {/* Shipping Status */}
              {isFreeShipping ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-300">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span className="font-medium">
                      Complimentary Pan-India Standard Delivery applied
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
                    Free Shipping
                  </span>
                </div>
              ) : (
                <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="flex items-center gap-2 text-text-secondary">
                      <Truck size={15} className="text-brand-yellow shrink-0" />
                      <span>
                        Add{" "}
                        <strong className="text-white font-semibold">
                          ₹{amountNeededForFreeShipping}
                        </strong>{" "}
                        more to qualify for{" "}
                        <span className="text-white font-medium">Free Shipping</span>
                      </span>
                    </span>
                    <span className="text-xs font-mono text-text-muted">
                      ₹{discountedSubtotal} / ₹{FREE_SHIPPING_THRESHOLD}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-bg-surface-alt overflow-hidden">
                    <div
                      className="h-full bg-brand-yellow rounded-full transition-all duration-300"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Items Card List */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface divide-y divide-border-subtle overflow-hidden">
                {items.map((item) => {
                  const itemTotal = item.price * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <Link
                          href={item.href}
                          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-bg-surface-alt border border-border-subtle shrink-0 group"
                        >
                          <Image
                            src={item.imageSrc}
                            alt={item.name}
                            fill
                            sizes="96px"
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </Link>

                        <div className="min-w-0 space-y-1">
                          <Link
                            href={item.href}
                            className="font-display font-bold text-base sm:text-lg text-white hover:text-brand-yellow transition-colors line-clamp-1"
                          >
                            {item.name}
                          </Link>

                          <div className="text-xs text-text-secondary">
                            Unit Price:{" "}
                            <span className="text-white font-mono font-medium">
                              ₹{item.price.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
                            <Sparkles size={10} />
                            <span>Print Ready</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-border-subtle rounded-xl bg-bg-surface-alt">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 rounded-l-xl transition-colors active:scale-90"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={15} />
                          </button>
                          <span className="w-10 text-center font-mono font-bold text-sm text-white select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/5 rounded-r-xl transition-colors active:scale-90"
                            aria-label="Increase quantity"
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        {/* Line Subtotal */}
                        <div className="text-right min-w-[90px]">
                          <div className="font-mono font-bold text-base sm:text-lg text-brand-yellow">
                            ₹{itemTotal.toLocaleString("en-IN")}
                          </div>
                          <span className="text-[11px] text-text-muted">Subtotal</span>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                          aria-label={`Remove ${item.name}`}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons below Items */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-brand-yellow transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Continue Shopping</span>
                </Link>

                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-text-muted hover:text-red-400 transition-colors"
                >
                  Clear Entire Cart
                </button>
              </div>
            </div>

            {/* Right Column: Order Summary & Checkout */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 sm:p-7 space-y-6 shadow-xl sticky top-24">
                <h2 className="font-display font-black text-xl text-white uppercase tracking-tight">
                  Order Summary
                </h2>

                {/* Promo Code Form */}
                <div>
                  <form onSubmit={handleApplyPromo} className="space-y-2">
                    <label
                      htmlFor="promo-input"
                      className="block text-xs font-semibold text-text-secondary uppercase tracking-wider"
                    >
                      Have a Coupon / Promo Code?
                    </label>

                    {appliedPromo ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={15} />
                          <span>
                            Code <strong>{appliedPromo.code}</strong> active (-
                            {appliedPromo.discountPercent}%)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={removePromo}
                          className="text-xs underline hover:text-white"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                          />
                          <input
                            id="promo-input"
                            type="text"
                            placeholder="e.g. STAR10"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            autoCapitalize="characters"
                            autoCorrect="off"
                            spellCheck="false"
                            className="w-full rounded-xl bg-bg-surface-alt border border-border-subtle pl-9 pr-3 py-2.5 text-xs text-white uppercase placeholder-text-muted focus:outline-none focus:border-brand-yellow font-mono"
                          />
                        </div>
                        <Button type="submit" variant="secondary" size="sm">
                          Apply
                        </Button>
                      </div>
                    )}

                    {promoSuccess && !appliedPromo && (
                      <p className="text-xs text-emerald-400">{promoSuccess}</p>
                    )}
                    {promoError && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={13} />
                        <span>{promoError}</span>
                      </p>
                    )}
                  </form>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 pt-2 border-t border-border-subtle text-sm">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span className="font-mono text-white">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {appliedPromo && (
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Discount ({appliedPromo.code})</span>
                      <span className="font-mono">
                        -₹{discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Estimated Shipping</span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-400 font-bold uppercase text-xs">
                        FREE
                      </span>
                    ) : (
                      <span className="font-mono text-white">₹{shippingFee}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <span>GST (18%)</span>
                      <span className="text-[10px] text-text-muted">
                        (Tax Invoice Included)
                      </span>
                    </span>
                    <span className="font-mono text-white">
                      ₹{gstAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-border-subtle flex items-baseline justify-between">
                    <div>
                      <div className="font-display font-black text-lg text-white uppercase">
                        Grand Total
                      </div>
                      <span className="text-[11px] text-text-muted">
                        Includes all taxes & packaging
                      </span>
                    </div>
                    <div className="font-mono font-black text-2xl text-brand-yellow">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Checkout CTA Button */}
                <Link href="/checkout" className="block w-full">
                  <Button variant="primary" size="lg" className="w-full justify-center">
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={18} />
                  </Button>
                </Link>

                {/* Trust Guarantees */}
                <div className="pt-3 border-t border-border-subtle space-y-2.5 text-xs text-text-secondary">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={14} className="text-emerald-400/90 shrink-0" />
                    <span>100% Quality & Pre-Press Proof Verification</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Truck size={14} className="text-emerald-400/90 shrink-0" />
                    <span>Express Dispatch with Real-Time Tracking</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={14} className="text-emerald-400/90 shrink-0" />
                    <span>Official GST Invoicing with Input Tax Credit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
