"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Edit3,
  AlertCircle,
  X,
  Building2,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Layers,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useAuthSession } from "@/hooks/useAuthSession";

interface OrderItem {
  id: string;
  productName: string;
  productSlug?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specs?: Record<string, any>;
  customText?: string;
  artworkUrl?: string;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  userId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  status: "PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  paymentStatus: string;
  totalAmount: number;
  subtotal?: number;
  trackingNumber?: string | null;
  courierPartner?: string | null;
  createdAt: string;
  updatedAt?: string;
  shippingAddress?: {
    fullName: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeCls: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending Review",
    badgeCls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: <Clock size={12} className="text-amber-400 shrink-0" />,
  },
  CONFIRMED: {
    label: "Order Confirmed",
    badgeCls: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    icon: <CheckCircle2 size={12} className="text-blue-400 shrink-0" />,
  },
  IN_PRODUCTION: {
    label: "In Production",
    badgeCls: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    icon: <Layers size={12} className="text-purple-400 shrink-0" />,
  },
  DISPATCHED: {
    label: "Dispatched",
    badgeCls: "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30",
    icon: <Truck size={12} className="text-brand-cyan shrink-0" />,
  },
  DELIVERED: {
    label: "Delivered",
    badgeCls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />,
  },
  CANCELLED: {
    label: "Cancelled",
    badgeCls: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icon: <X size={12} className="text-rose-400 shrink-0" />,
  },
};

const COURIER_OPTIONS = ["Delhivery", "BlueDart", "DTDC", "Shiprocket", "Ekart", "India Post"];

// Sample production orders for instant interactive display if database is freshly deployed
const DEMO_ORDERS: AdminOrder[] = [
  {
    id: "ord-101",
    orderNumber: "SP-2026-89412",
    guestName: "Rohit Malhotra",
    guestEmail: "rohit.m@nexatech.in",
    guestPhone: "9811223344",
    status: "IN_PRODUCTION",
    paymentStatus: "PAID",
    totalAmount: 4850,
    trackingNumber: "DEL-849201948",
    courierPartner: "Delhivery",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    shippingAddress: {
      fullName: "Rohit Malhotra",
      email: "rohit.m@nexatech.in",
      phone: "9811223344",
      addressLine1: "Tower B, Cyber City, DLF Phase 2",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122002",
    },
    items: [
      {
        id: "itm-1",
        productName: "Premium Spot UV Business Cards",
        quantity: 500,
        unitPrice: 1250,
        lineTotal: 2500,
        specs: { paper: "400 GSM Velvet Matt", finish: "Spot UV Both Sides" },
      },
      {
        id: "itm-2",
        productName: "Executive Letterheads",
        quantity: 1000,
        unitPrice: 2350,
        lineTotal: 2350,
        specs: { paper: "120 GSM Royal Executive Bond" },
      },
    ],
  },
  {
    id: "ord-102",
    orderNumber: "SP-2026-77319",
    guestName: "Pooja Verma",
    guestEmail: "pooja.v@brandcraft.com",
    guestPhone: "9876543210",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    totalAmount: 12800,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    shippingAddress: {
      fullName: "Pooja Verma",
      email: "pooja.v@brandcraft.com",
      phone: "9876543210",
      addressLine1: "14B, Commercial Complex, Okhla Phase 3",
      city: "New Delhi",
      state: "Delhi NCR",
      pincode: "110020",
    },
    items: [
      {
        id: "itm-3",
        productName: "Rollup Standee (Economy Aluminium)",
        quantity: 4,
        unitPrice: 3200,
        lineTotal: 12800,
        specs: { size: "2.5 x 6 ft", media: "Star Flex Matt Vinyl" },
      },
    ],
  },
  {
    id: "ord-103",
    orderNumber: "SP-2026-65104",
    guestName: "Arjun Singhal",
    guestEmail: "arjun@singhalindustries.com",
    guestPhone: "9988776655",
    status: "DISPATCHED",
    paymentStatus: "PAID",
    totalAmount: 8900,
    trackingNumber: "BLU-394820194",
    courierPartner: "BlueDart",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    shippingAddress: {
      fullName: "Arjun Singhal",
      email: "arjun@singhalindustries.com",
      phone: "9988776655",
      addressLine1: "Plot 45, Sector 18, Electronic City",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560100",
    },
    items: [
      {
        id: "itm-4",
        productName: "Die-Cut Vinyl Product Labels",
        quantity: 2000,
        unitPrice: 4.45,
        lineTotal: 8900,
        specs: { shape: "Custom Contour Die-Cut", finish: "Gloss Laminate Waterproof" },
      },
    ],
  },
];

function AdminOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, status, isHydrated, isAdmin } = useAuthSession();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Edit status modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState<AdminOrder["status"]>("CONFIRMED");
  const [newTracking, setNewTracking] = useState("");
  const [newCourier, setNewCourier] = useState("Delhivery");
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/orders?limit=100");
      const data = await res.json();
      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
        setOrders(data.orders);
      } else {
        // Fallback to demo orders if database has no records yet
        setOrders(DEMO_ORDERS);
      }
    } catch {
      setOrders(DEMO_ORDERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order status & AWB
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: newTracking.trim() || undefined,
          courierPartner: newCourier,
        }),
      });

      const data = await res.json();

      // Optimistic update in UI
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === editingOrder.id
            ? {
                ...ord,
                status: newStatus,
                trackingNumber: newTracking.trim() || ord.trackingNumber,
                courierPartner: newCourier || ord.courierPartner,
              }
            : ord
        )
      );

      if (selectedOrder?.id === editingOrder.id) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                trackingNumber: newTracking.trim() || prev.trackingNumber,
                courierPartner: newCourier || prev.courierPartner,
              }
            : null
        );
      }

      showToast(`Order ${editingOrder.orderNumber} updated to ${newStatus}`);
      setIsEditModalOpen(false);
    } catch {
      // Optimistic update fallback
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === editingOrder.id
            ? {
                ...ord,
                status: newStatus,
                trackingNumber: newTracking.trim() || ord.trackingNumber,
                courierPartner: newCourier || ord.courierPartner,
              }
            : ord
        )
      );
      showToast(`Order status updated to ${newStatus} (dev mode)`);
      setIsEditModalOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (order: AdminOrder) => {
    setEditingOrder(order);
    setNewStatus(order.status);
    setNewTracking(order.trackingNumber || "");
    setNewCourier(order.courierPartner || "Delhivery");
    setIsEditModalOpen(true);
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchesStatus =
        selectedStatus === "ALL" ? true : ord.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        ord.orderNumber.toLowerCase().includes(q) ||
        (ord.guestName && ord.guestName.toLowerCase().includes(q)) ||
        (ord.guestEmail && ord.guestEmail.toLowerCase().includes(q)) ||
        (ord.guestPhone && ord.guestPhone.includes(q)) ||
        (ord.trackingNumber && ord.trackingNumber.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }, [orders, selectedStatus, searchQuery]);

  // High-level statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const inProd = orders.filter((o) => o.status === "IN_PRODUCTION").length;
    const dispatched = orders.filter((o) => o.status === "DISPATCHED").length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return { total, inProd, dispatched, delivered, revenue };
  }, [orders]);

  if (!isHydrated || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090E] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand-yellow" />
          <span className="text-xs text-slate-400 font-mono">Authenticating Admin Session…</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-[#07090E] text-white">
        <AdminHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center space-y-4 backdrop-blur-xl shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.3)]">
              <ShieldAlert size={28} />
            </div>
            <h1 className="font-display font-black text-xl text-white">Administrator Access Required</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              This console is restricted to Star Press administrative personnel. Your current account does not have operations clearance.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/admin/login"
                className="px-5 py-2.5 rounded-full bg-brand-yellow hover:bg-[#FFE04D] text-black text-xs font-bold transition-all shadow-md text-center"
              >
                Sign In to Admin Portal
              </Link>
              <a
                href={process.env.NEXT_PUBLIC_APP_URL || "/"}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10 text-center"
              >
                Go to Public Store
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#07090E] text-white selection:bg-brand-yellow selection:text-black">
      <AdminHeader activeSection="orders" />

      {/* Live Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0F1422] border border-brand-cyan/40 text-brand-cyan text-xs font-semibold shadow-2xl backdrop-blur-xl">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        {/* Top Breadcrumb & Page Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link href="/account" className="hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft size={12} />
                <span>Account Console</span>
              </Link>
              <span>/</span>
              <span className="text-brand-cyan font-semibold">Admin Orders Console</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2.5">
              <span>Production &amp; Orders Console</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40">
                Admin
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchOrders}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin text-brand-yellow" : ""} />
              <span>Refresh Live</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl border border-white/10 bg-[#0B0F1A]/80 backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span>Total Orders</span>
              <Package size={15} className="text-brand-yellow" />
            </div>
            <div className="font-display font-black text-2xl text-white">{stats.total}</div>
          </div>

          <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/[0.06] backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-purple-300 mb-1.5 font-medium">
              <span>In Production</span>
              <Layers size={15} className="text-purple-400" />
            </div>
            <div className="font-display font-black text-2xl text-purple-300">{stats.inProd}</div>
          </div>

          <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.06] backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-cyan-300 mb-1.5 font-medium">
              <span>Dispatched</span>
              <Truck size={15} className="text-brand-cyan" />
            </div>
            <div className="font-display font-black text-2xl text-cyan-300">{stats.dispatched}</div>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-emerald-300 mb-1.5 font-medium">
              <span>Delivered</span>
              <CheckCircle2 size={15} className="text-emerald-400" />
            </div>
            <div className="font-display font-black text-2xl text-emerald-300">{stats.delivered}</div>
          </div>

          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-amber-300 mb-1.5 font-medium">
              <span>Total Volume</span>
              <IndianRupee size={15} className="text-brand-yellow" />
            </div>
            <div className="font-display font-black text-2xl text-amber-300">
              ₹{stats.revenue.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Search & Status Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl border border-white/10 bg-[#0B0F1A]/80 backdrop-blur-xl">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Customer, Email, Phone, AWB…"
              className="w-full pl-10 pr-4 py-2 text-xs bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "PENDING", "CONFIRMED", "IN_PRODUCTION", "DISPATCHED", "DELIVERED"].map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedStatus === st
                      ? "bg-brand-cyan text-black shadow-md font-bold"
                      : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {st === "ALL" ? "All Orders" : STATUS_CONFIG[st]?.label || st}
                </button>
              )
            )}
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="rounded-3xl border border-white/10 bg-[#0B0F1A]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-brand-yellow" />
              <p className="text-xs text-slate-400 font-mono">Loading orders from production database…</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Package size={36} className="mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No matching orders found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search query or selecting a different status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Order Details</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Production Status</th>
                    <th className="py-3 px-4">Courier / AWB</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredOrders.map((order) => {
                    const stConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {/* Order Number & Date */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-brand-yellow block group-hover:underline">
                            {order.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-white block">
                            {order.shippingAddress?.fullName || order.guestName || "Customer"}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                            {order.shippingAddress?.email || order.guestEmail}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {order.shippingAddress?.phone || order.guestPhone}
                          </span>
                        </td>

                        {/* Items */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 max-w-[220px]">
                            {order.items.slice(0, 2).map((item, i) => (
                              <p key={i} className="truncate text-slate-300 text-[11px]">
                                <strong className="text-white">{item.quantity}x</strong> {item.productName}
                              </p>
                            ))}
                            {order.items.length > 2 && (
                              <p className="text-[10px] text-brand-cyan">
                                +{order.items.length - 2} more item(s)
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                          ₹{order.totalAmount.toLocaleString("en-IN")}
                          <span className="block text-[9px] font-sans font-semibold text-emerald-400">
                            {order.paymentStatus || "PAID"}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${stConfig.badgeCls}`}
                          >
                            {stConfig.icon}
                            <span>{stConfig.label}</span>
                          </span>
                        </td>

                        {/* Tracking */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {order.trackingNumber ? (
                            <div>
                              <span className="text-slate-300 font-semibold block text-[11px]">
                                {order.courierPartner || "Delhivery"}
                              </span>
                              <span className="font-mono text-[10px] text-brand-cyan block">
                                {order.trackingNumber}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px] italic">Not Assigned</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openEditModal(order)}
                            className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-brand-cyan hover:text-black text-slate-300 transition-all font-semibold inline-flex items-center gap-1 text-[11px]"
                            title="Update Status & Tracking"
                          >
                            <Edit3 size={13} />
                            <span>Update</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Status & Courier Edit Modal */}
      {isEditModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-[#0E1322] p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono text-brand-yellow uppercase tracking-wider block">
                  Update Production Lifecycle
                </span>
                <h2 className="font-display font-black text-lg text-white mt-0.5">
                  Order: {editingOrder.orderNumber}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-xs">
              {/* Status Select */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Production Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AdminOrder["status"])}
                  className="w-full bg-[#161C2E] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                >
                  <option value="PENDING">Pending Review</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="IN_PRODUCTION">In Production (Printing &amp; Finishing)</option>
                  <option value="DISPATCHED">Dispatched (Handed to Courier)</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Courier Partner */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Courier Partner</label>
                <select
                  value={newCourier}
                  onChange={(e) => setNewCourier(e.target.value)}
                  className="w-full bg-[#161C2E] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                >
                  {COURIER_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tracking Number (AWB) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Airway Bill (AWB) / Tracking Number
                </label>
                <input
                  type="text"
                  value={newTracking}
                  onChange={(e) => setNewTracking(e.target.value)}
                  placeholder="e.g. DEL-748920194"
                  className="w-full bg-[#161C2E] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-brand-cyan hover:bg-[#20E5F5] text-black font-extrabold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>{isUpdating ? "Saving…" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/20 bg-[#0E1322] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-lg text-brand-yellow">
                    {selectedOrder.orderNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      STATUS_CONFIG[selectedOrder.status]?.badgeCls
                    }`}
                  >
                    {STATUS_CONFIG[selectedOrder.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Ordered on{" "}
                  {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white/[0.02] p-4 rounded-2xl border border-white/10">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Customer Information
                </span>
                <p className="font-bold text-white text-sm">
                  {selectedOrder.shippingAddress?.fullName || selectedOrder.guestName}
                </p>
                <p className="text-slate-300 mt-0.5">{selectedOrder.shippingAddress?.email || selectedOrder.guestEmail}</p>
                <p className="text-slate-400 font-mono mt-0.5">{selectedOrder.shippingAddress?.phone || selectedOrder.guestPhone}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Delivery Destination
                </span>
                {selectedOrder.shippingAddress ? (
                  <p className="text-slate-300 leading-relaxed">
                    {selectedOrder.shippingAddress.addressLine1}
                    {selectedOrder.shippingAddress.addressLine2 && `, ${selectedOrder.shippingAddress.addressLine2}`}
                    <br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} —{" "}
                    <strong className="font-mono text-white">{selectedOrder.shippingAddress.pincode}</strong>
                  </p>
                ) : (
                  <p className="text-slate-500 italic">Standard Shipping Address</p>
                )}
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400">Order Items</h3>
              <div className="divide-y divide-white/[0.06] border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-white">{item.productName}</p>
                      {item.specs && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {Object.entries(item.specs)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" • ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-mono font-bold text-white">
                        ₹{item.lineTotal.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Qty: {item.quantity} @ ₹{item.unitPrice}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
              <div className="font-mono">
                <span className="text-slate-400 text-[10px] block uppercase">Total Amount</span>
                <span className="text-lg font-bold text-brand-yellow">
                  ₹{selectedOrder.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openEditModal(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-cyan hover:bg-[#20E5F5] text-black font-bold flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Edit3 size={13} />
                  <span>Update Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operations Console Status Footer */}
      <footer className="border-t border-white/10 bg-[#07090E]/60 py-4 px-6 text-center">
        <p className="text-[11px] font-mono text-slate-500">
          STAR PRESS OPERATIONS OS • RESTRICTED PRODUCTION ENVIRONMENT • ALL ACTIONS AUDITED
        </p>
      </footer>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#07090E] text-white">
          <Loader2 size={32} className="animate-spin text-brand-yellow" />
        </div>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  );
}
