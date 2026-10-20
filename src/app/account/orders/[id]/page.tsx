"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileCheck,
  CreditCard,
  MapPin,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  ShoppingBag,
  RotateCcw,
  XCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/lib/supabase/client";
import { WHATSAPP_NUMBER } from "@/lib/data";

interface OrderItem {
  id: string;
  productId?: string | null;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specs?: any;
  customText?: string | null;
  previewUrl?: string | null;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  gstAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: any;
  billingAddress?: any;
  paymentMethod?: string | null;
  paymentStatus: string;
  trackingNumber?: string | null;
  courierPartner?: string | null;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
}

const ORDER_STAGES = [
  { key: "PENDING", label: "Order Placed", desc: "Specifications verified" },
  { key: "CONFIRMED", label: "Confirmed", desc: "Pre-press proof approved" },
  { key: "IN_PRODUCTION", label: "In Production", desc: "Printing & bindery" },
  { key: "DISPATCHED", label: "Dispatched", desc: "Handed over to courier" },
  { key: "DELIVERED", label: "Delivered", desc: "Delivered to destination" },
];

function getStageIndex(status: string): number {
  const norm = (status || "").toUpperCase();
  if (norm === "DELIVERED") return 4;
  if (norm === "DISPATCHED" || norm === "SHIPPED") return 3;
  if (norm === "IN_PRODUCTION" || norm === "PROCESSING") return 2;
  if (norm === "CONFIRMED") return 1;
  return 0;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const { addItem } = useCart();
  const { session, status, isHydrated } = useAuthSession();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Reorder state
  const [reorderedItemsCount, setReorderedItemsCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    async function loadOrder() {
      setIsLoading(true);
      setError(null);

      try {
        let authToken: string | undefined;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          authToken = sessionData?.session?.access_token;
        } catch {}

        const res = await fetch(`/api/orders/${orderId}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });

        if (!res.ok) {
          throw new Error("Order not found or unauthorized access.");
        }

        const data = await res.json();
        if (!cancelled && data.order) {
          setOrder(data.order);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load order details.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reorder single item or entire order
  const handleReorder = (specificItem?: OrderItem) => {
    if (!order) return;

    const itemsToAdd = specificItem ? [specificItem] : order.items;

    itemsToAdd.forEach((item) => {
      const specs = item.specs || {};
      const customKey = `${item.productId || item.productSlug}-${specs.sizeId || "std"}-${specs.materialId || "std"}-${Date.now().toString(36)}`;

      addItem(
        {
          id: customKey,
          productId: item.productId || undefined,
          productSlug: item.productSlug,
          name: item.productName,
          price: Number(item.unitPrice),
          imageSrc: item.previewUrl || "/images/hero-composition.jpg",
          href: `/shop/${item.productSlug}`,
          quantity: item.quantity,
          sizeId: specs.sizeId,
          sizeLabel: specs.sizeLabel,
          materialId: specs.materialId,
          materialLabel: specs.materialLabel,
          customText: item.customText || specs.customText,
          customizations: {
            personalizedText: item.customText || specs.customText,
            notes: specs.notes,
          },
          specs: item.specs,
        },
        item.quantity
      );
    });

    setReorderedItemsCount(itemsToAdd.length);
    setTimeout(() => {
      router.push("/cart");
    }, 1200);
  };

  // Cancel order handler
  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    setCancelError(null);

    try {
      let authToken: string | undefined;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        authToken = sessionData?.session?.access_token;
      } catch {}

      const res = await fetch(`/api/account/orders/${order.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order.");
      }

      setCancelSuccess(true);
      setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : prev));
      setTimeout(() => {
        setShowCancelModal(false);
      }, 2000);
    } catch (err: any) {
      setCancelError(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const isCancelled = order?.status?.toUpperCase() === "CANCELLED";
  const isPaid = order?.paymentStatus?.toUpperCase() === "PAID";
  const activeStage = order ? getStageIndex(order.status) : 0;
  const isEligibleForCancellation =
    order &&
    !isCancelled &&
    (order.status.toUpperCase() === "PENDING" || order.status.toUpperCase() === "CONFIRMED");

  const whatsappInquiry = encodeURIComponent(
    `Hi Star Press, I have an inquiry regarding Order #${order?.orderNumber}.`
  );

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 lg:px-10 py-10 md:py-14 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/account" className="hover:text-text-primary transition-colors">
            Account
          </Link>
          <span>/</span>
          <Link href="/account?tab=orders" className="hover:text-text-primary transition-colors">
            Your Orders
          </Link>
          <span>/</span>
          <span className="text-brand-yellow font-medium truncate">
            {order?.orderNumber || "Order Details"}
          </span>
        </div>

        {isLoading ? (
          <div className="py-24 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-brand-yellow" />
            <span>Loading order specifications and delivery status...</span>
          </div>
        ) : error || !order ? (
          <div className="rounded-2xl border border-rose-500/30 bg-bg-surface p-10 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>
            <h1 className="font-display font-black text-xl text-text-primary uppercase">
              Order Not Available
            </h1>
            <p className="text-xs text-text-secondary">{error || "Unable to find the requested order."}</p>
            <Link href="/account?tab=orders" className="inline-block pt-2">
              <Button variant="primary" size="md">
                <span>View All Orders</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary uppercase tracking-tight">
                    Order #{order.orderNumber}
                  </h1>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.orderNumber)}
                    className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
                    title="Copy Order Number"
                  >
                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Ordered on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    weekday: "short",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Status Badge & Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isCancelled
                    ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                    : activeStage === 4
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow"
                }`}>
                  <Clock size={13} />
                  <span>{isCancelled ? "Cancelled" : ORDER_STAGES[activeStage]?.label || order.status}</span>
                </span>

                <Link
                  href={`/account/orders/${order.id}/invoice`}
                  className="px-3.5 py-1.5 rounded-xl border border-border-subtle bg-bg-surface-alt hover:bg-bg-surface text-xs font-semibold text-text-primary transition-colors flex items-center gap-1.5"
                >
                  <FileCheck size={13} className="text-brand-yellow" />
                  <span>Tax Invoice</span>
                </Link>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleReorder()}
                  className="font-bold text-xs uppercase"
                >
                  {reorderedItemsCount ? (
                    <span className="flex items-center gap-1 text-black">
                      <Check size={14} className="stroke-[3]" />
                      <span>Added to Cart!</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <RotateCcw size={13} />
                      <span>Buy Again</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Reorder feedback notice */}
            {reorderedItemsCount && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>{reorderedItemsCount} items with exact specifications copied to your cart. Navigating to cart...</span>
                </div>
                <Link href="/cart" className="font-bold underline text-white">
                  View Cart Now
                </Link>
              </div>
            )}

            {/* Stepper Progress Bar */}
            {!isCancelled ? (
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 sm:p-8 space-y-6 shadow-lg">
                <div className="flex items-center justify-between pb-2">
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-text-secondary">
                    Production & Dispatch Timeline
                  </span>
                  <Link
                    href={`/orders/track?order=${encodeURIComponent(order.orderNumber)}`}
                    className="text-xs font-bold text-brand-yellow hover:underline flex items-center gap-1"
                  >
                    <span>Full Tracking View</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>

                <div className="relative pt-2">
                  <div className="hidden sm:block absolute top-6 left-10 right-10 h-1 bg-bg-surface-alt -z-0">
                    <div
                      className="h-full bg-brand-yellow transition-all duration-500"
                      style={{ width: `${(activeStage / (ORDER_STAGES.length - 1)) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2 relative z-10">
                    {ORDER_STAGES.map((stg, idx) => {
                      const isDone = activeStage > idx;
                      const isCurrent = activeStage === idx;

                      return (
                        <div key={stg.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                            isDone
                              ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                              : isCurrent
                              ? "bg-brand-yellow text-black ring-4 ring-brand-yellow/20 shadow-lg scale-105"
                              : "bg-bg-surface-alt border border-border-subtle text-text-muted"
                          }`}>
                            {isDone ? <Check size={15} className="stroke-[3]" /> : idx + 1}
                          </div>

                          <div>
                            <div className={`text-xs font-bold uppercase tracking-wider ${
                              isCurrent ? "text-brand-yellow" : isDone ? "text-text-primary" : "text-text-muted"
                            }`}>
                              {stg.label}
                            </div>
                            <div className="text-[10px] text-text-muted hidden sm:block mt-0.5">
                              {stg.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <XCircle size={16} className="text-rose-400 shrink-0" />
                <span>This order was cancelled. Inventory reservations have been released.</span>
              </div>
            )}

            {/* 3-Column Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Delivery Address */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 sm:p-6 space-y-3 shadow-md">
                <div className="flex items-center gap-2 font-display font-bold text-xs uppercase tracking-wider text-text-primary pb-2 border-b border-border-subtle">
                  <MapPin size={14} className="text-brand-yellow" />
                  <span>Delivery Address</span>
                </div>
                <div className="text-xs text-text-secondary leading-relaxed space-y-1">
                  <p className="font-bold text-text-primary text-sm">
                    {order.shippingAddress?.fullName || order.shippingAddress?.name || "Recipient"}
                  </p>
                  <p>{order.shippingAddress?.addressLine1 || order.shippingAddress?.line1}</p>
                  {(order.shippingAddress?.addressLine2 || order.shippingAddress?.line2) && (
                    <p>{order.shippingAddress?.addressLine2 || order.shippingAddress?.line2}</p>
                  )}
                  <p>
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                    <strong className="text-text-primary font-mono">{order.shippingAddress?.pincode}</strong>
                  </p>
                  {order.shippingAddress?.phone && (
                    <p className="pt-1 text-text-muted">
                      Phone: <strong className="text-text-primary font-mono">{order.shippingAddress.phone}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Card 2: Payment Details */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 sm:p-6 space-y-3 shadow-md">
                <div className="flex items-center gap-2 font-display font-bold text-xs uppercase tracking-wider text-text-primary pb-2 border-b border-border-subtle">
                  <CreditCard size={14} className="text-brand-yellow" />
                  <span>Payment Details</span>
                </div>
                <div className="text-xs text-text-secondary space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Payment Mode:</span>
                    <strong className="text-text-primary">
                      {order.paymentMethod === "ONLINE" ? "Online Razorpay" : "Pay After Proof"}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Payment Status:</span>
                    <span className={`font-bold uppercase ${isPaid ? "text-emerald-400" : "text-amber-500 dark:text-amber-400"}`}>
                      {order.paymentStatus}
                    </span>
                  </div>

                  {!isPaid && !isCancelled && (
                    <div className="pt-2">
                      <Link
                        href={`/account/orders/${order.id}/pay`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-yellow text-black font-bold text-xs hover:bg-yellow-400 transition-colors shadow-sm"
                      >
                        <CreditCard size={13} />
                        <span>Complete Payment via Razorpay</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Financial Summary */}
              <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 sm:p-6 space-y-2.5 shadow-md text-xs">
                <div className="flex items-center gap-2 font-display font-bold text-xs uppercase tracking-wider text-text-primary pb-2 border-b border-border-subtle">
                  <FileCheck size={14} className="text-brand-yellow" />
                  <span>Financial Breakdown</span>
                </div>

                <div className="flex items-center justify-between text-text-secondary">
                  <span>Items Subtotal</span>
                  <span className="font-mono text-text-primary">₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
                </div>

                {Number(order.discountAmount) > 0 && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>Discount</span>
                    <span className="font-mono">−₹{Number(order.discountAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-text-secondary">
                  <span>GST (18%)</span>
                  <span className="font-mono text-text-primary">₹{Number(order.gstAmount || 0).toLocaleString("en-IN")}</span>
                </div>

                <div className="flex items-center justify-between text-text-secondary">
                  <span>Shipping Fee</span>
                  <span className="font-mono text-text-primary">
                    {Number(order.shippingFee) === 0 ? "FREE" : `₹${Number(order.shippingFee)}`}
                  </span>
                </div>

                <div className="pt-2 border-t border-border-subtle flex items-baseline justify-between font-bold text-sm">
                  <span className="text-text-primary uppercase font-display">Grand Total</span>
                  <span className="font-mono text-brand-yellow text-base font-black">
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Order Package Details */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 sm:p-8 space-y-4 shadow-xl">
              <h2 className="font-display font-black text-lg text-text-primary uppercase tracking-tight pb-3 border-b border-border-subtle">
                Order Items ({order.items.length})
              </h2>

              <div className="divide-y divide-border-subtle/60">
                {order.items.map((it) => (
                  <div key={it.id} className="py-5 first:pt-2 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <Link
                        href={`/shop/${it.productSlug}`}
                        className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-bg-surface-alt border border-border-subtle shrink-0 group mt-0.5"
                      >
                        <Image
                          src={it.previewUrl || "/images/hero-composition.jpg"}
                          alt={it.productName}
                          fill
                          sizes="80px"
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </Link>

                      <div className="min-w-0 space-y-1.5 flex-1">
                        <Link
                          href={`/shop/${it.productSlug}`}
                          className="font-display font-bold text-base text-text-primary hover:text-brand-yellow transition-colors line-clamp-1"
                        >
                          {it.productName}
                        </Link>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                          {it.specs?.sizeLabel && (
                            <span className="bg-bg-surface-alt border border-border-subtle px-2 py-0.5 rounded text-text-primary text-[11px]">
                              Size: {it.specs.sizeLabel}
                            </span>
                          )}
                          {it.specs?.materialLabel && (
                            <span className="bg-bg-surface-alt border border-border-subtle px-2 py-0.5 rounded text-text-primary text-[11px]">
                              Material: {it.specs.materialLabel}
                            </span>
                          )}
                          <span className="font-mono text-brand-yellow font-semibold text-xs">
                            Qty: {it.quantity.toLocaleString()} units
                          </span>
                        </div>

                        {(it.customText || it.specs?.customText) && (
                          <p className="text-xs text-amber-500 dark:text-amber-300 italic pt-0.5">
                            Personalization: &ldquo;{it.customText || it.specs?.customText}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border-subtle gap-3">
                      <div className="text-right">
                        <div className="font-mono font-bold text-base text-brand-yellow">
                          ₹{Number(it.lineTotal).toLocaleString("en-IN")}
                        </div>
                        <span className="text-[10px] text-text-muted">
                          (₹{Number(it.unitPrice)} / unit)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReorder(it)}
                        className="px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-surface-alt hover:border-brand-yellow/60 text-xs font-semibold text-text-primary transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw size={12} className="text-brand-yellow" />
                        <span>Reorder Item</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions: WhatsApp Help & Order Cancellation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-subtle">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappInquiry}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#25D366] hover:underline"
              >
                <MessageCircle size={15} />
                <span>Need support with this order? Chat with our Khatima Press Team</span>
              </a>

              {isEligibleForCancellation && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline transition-colors"
                >
                  Request Order Cancellation
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cancellation Modal Dialog */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-bg-surface p-6 sm:p-7 space-y-4 shadow-2xl relative">
              <h3 className="font-display font-black text-xl text-text-primary uppercase tracking-tight">
                Cancel Order #{order?.orderNumber}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Because this order has not yet entered offset production, it can be cancelled immediately and all inventory reservations will be restored.
              </p>

              {cancelSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Order cancelled successfully. Updating order record...</span>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5 text-xs">
                    <label className="font-semibold text-text-secondary uppercase">
                      Reason for Cancellation (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Changed my artwork specifications, ordered by mistake, etc."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full bg-bg-surface-alt border border-border-subtle rounded-xl p-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-yellow resize-none"
                    />
                  </div>

                  {cancelError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      <span>{cancelError}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => setShowCancelModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary"
                    >
                      Keep Order
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isCancelling}
                      onClick={handleCancelOrder}
                      className="!border-rose-500/40 !bg-rose-500/10 !text-rose-400 hover:!bg-rose-500/20 font-bold text-xs"
                    >
                      {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
