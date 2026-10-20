"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Package,
  Truck,
  RotateCcw,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Search,
  ChevronRight,
  Loader2,
  FileText,
  CreditCard,
  Check,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase/client";

interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  productSlug?: string;
  quantity: number;
  unitPrice?: number;
  lineTotal: number;
  specs?: any;
  customText?: string;
  previewUrl?: string;
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  trackingNumber?: string | null;
  courierPartner?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function AccountOrdersPage() {
  const router = useRouter();
  const { session, status, isHydrated } = useAuthSession();
  const { addItem } = useCart();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reorderedId, setReorderedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated || status === "loading") return;
    if (status === "unauthenticated" && !session?.user) {
      router.replace("/login?callbackUrl=/account/orders");
    }
  }, [isHydrated, status, session, router]);

  useEffect(() => {
    if (session?.user) {
      supabase.auth.getSession().then(({ data: sessionData }: any) => {
        const token = sessionData?.session?.access_token;
        fetch("/api/account/orders", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.orders && Array.isArray(data.orders)) {
              setOrders(data.orders);
            }
          })
          .catch(() => {})
          .finally(() => {
            setIsLoading(false);
          });
      });
    }
  }, [session]);

  const handleReorder = (order: OrderRecord) => {
    if (!order.items || order.items.length === 0) return;

    order.items.forEach((item) => {
      const specs = item.specs || {};
      const customKey = `${item.productId || item.productSlug || item.id}-${specs.sizeId || "std"}-${specs.materialId || "std"}-${Date.now().toString(36)}`;

      addItem(
        {
          id: customKey,
          productId: item.productId,
          productSlug: item.productSlug,
          name: item.productName,
          price: item.unitPrice || Number(item.lineTotal) / (item.quantity || 1),
          imageSrc: item.previewUrl || "/images/hero-composition.jpg",
          href: item.productSlug ? `/shop/${item.productSlug}` : "/shop",
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

    setReorderedId(order.id);
    setTimeout(() => {
      router.push("/cart");
    }, 1200);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items?.some((it) => it.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "in_production") return o.status === "IN_PRODUCTION" || o.status === "PENDING" || o.status === "CONFIRMED";
    if (statusFilter === "dispatched") return o.status === "DISPATCHED";
    if (statusFilter === "delivered") return o.status === "DELIVERED";
    if (statusFilter === "cancelled") return o.status === "CANCELLED";
    return true;
  });

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
          <span className="text-brand-yellow font-medium">Your Orders</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
          <div>
            <h1 className="font-display font-black text-3xl text-text-primary uppercase tracking-tight">
              Your Orders
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Review print job history, track live couriers, and reorder commercial formats.
            </p>
          </div>

          <Link href="/shop">
            <Button variant="outline" size="sm" className="text-xs">
              <span>Browse Catalog</span>
            </Button>
          </Link>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search orders by item or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-yellow"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs">
            {[
              { id: "all", label: "All Orders" },
              { id: "in_production", label: "In Production" },
              { id: "dispatched", label: "Dispatched" },
              { id: "delivered", label: "Delivered" },
              { id: "cancelled", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === tab.id
                    ? "bg-brand-yellow text-black font-bold"
                    : "bg-bg-surface-alt border border-border-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin text-brand-yellow" />
            <span>Loading your print orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-bg-surface-alt border border-border-subtle flex items-center justify-center mx-auto text-text-muted">
              <Package size={28} />
            </div>
            <h2 className="font-display font-black text-xl text-text-primary uppercase">
              No Orders Found
            </h2>
            <p className="text-xs text-text-secondary">
              {searchQuery
                ? `No orders match "${searchQuery}". Try searching another keyword.`
                : "You have not placed any commercial print orders yet."}
            </p>
            <Link href="/shop" className="inline-block pt-2">
              <Button variant="primary" size="md">
                <span>Start Printing with Star Press</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const isPaid = order.paymentStatus?.toUpperCase() === "PAID";
              const isCancelled = order.status?.toUpperCase() === "CANCELLED";

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-border-subtle bg-bg-surface overflow-hidden shadow-lg transition-colors hover:border-border-strong"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 bg-bg-surface-alt/70 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-6 text-text-secondary">
                      <div>
                        <span className="text-text-muted block text-[10px] uppercase font-semibold">Order Placed</span>
                        <span className="text-text-primary font-medium">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div>
                        <span className="text-text-muted block text-[10px] uppercase font-semibold">Total Amount</span>
                        <span className="font-mono text-text-primary font-bold">
                          ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div>
                        <span className="text-text-muted block text-[10px] uppercase font-semibold">Payment</span>
                        <span className={`font-bold uppercase ${isPaid ? "text-emerald-400" : "text-amber-500 dark:text-amber-400"}`}>
                          {isPaid ? "PAID" : "UNPAID"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-text-muted font-mono text-[11px]">#{order.orderNumber}</span>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-brand-yellow font-bold hover:underline flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {/* Card Body with Items */}
                  <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          isCancelled
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : order.status === "DELIVERED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20"
                        }`}>
                          <Clock size={11} />
                          <span>{order.status}</span>
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {order.items?.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <Package size={13} className="text-text-muted shrink-0" />
                            <span className="font-semibold text-text-primary">{it.productName}</span>
                            <span className="text-text-muted font-mono">({it.quantity} units)</span>
                            {it.customText && (
                              <span className="text-[11px] text-amber-500 dark:text-amber-300 italic truncate max-w-xs">
                                &ldquo;{it.customText}&rdquo;
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2.5 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                      <Link
                        href={`/orders/track?order=${encodeURIComponent(order.orderNumber)}`}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-bg-surface-alt hover:bg-bg-surface border border-border-subtle text-xs font-bold text-text-primary transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Truck size={13} className="text-brand-yellow" />
                        <span>Track Package</span>
                      </Link>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReorder(order)}
                        className="w-full sm:w-auto font-bold text-xs uppercase"
                      >
                        {reorderedId === order.id ? (
                          <span className="flex items-center gap-1 text-black">
                            <Check size={13} className="stroke-[3]" />
                            <span>Added to Cart!</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <RotateCcw size={12} />
                            <span>Buy Again</span>
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
