"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  Download,
  ShieldCheck,
  Building,
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface OrderItem {
  id: string;
  productName: string;
  productSlug?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specs?: any;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentId: string | null;
  razorpayOrderId?: string | null;
  subtotal: number;
  gstAmount: number | null;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: any;
  billingAddress?: any;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  items: OrderItem[];
  user?: {
    name: string;
    email: string;
    phone?: string | null;
  } | null;
}

function numberToWords(num: number): string {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const n = Math.floor(num);
  if (n === 0) return "Zero Rupees Only";

  function convert(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + convert(n % 100) : "")
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + convert(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + convert(n % 100000) : "")
      );
    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "")
    );
  }

  return "Rupees " + convert(n) + " Only";
}

export default function OrderInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders/${orderId}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Order not found or access denied.");
        }
        return res.json();
      })
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
        } else {
          setError("Invoice data is currently unavailable.");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load tax invoice.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-text-primary">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin mb-3" />
        <p className="text-sm text-text-secondary">Generating Official GST Tax Invoice...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6 text-text-primary">
        <div className="max-w-md w-full bg-bg-surface border border-border-subtle rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-display font-bold text-text-primary">Invoice Unavailable</h2>
          <p className="text-xs text-text-secondary">{error || "Could not load invoice."}</p>
          <Button variant="secondary" size="sm" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const addr = order.shippingAddress || {};
  const customerName =
    addr.fullName || order.guestName || order.user?.name || "Customer";
  const customerPhone =
    addr.phone || order.guestPhone || order.user?.phone || "-";
  const customerEmail =
    addr.email || order.guestEmail || order.user?.email || "-";
  const buyerGstin = addr.gstin || (addr.isGstRequired ? addr.gstin : null);
  const companyName = addr.companyName || null;
  const buyerState = addr.state || "Delhi NCR";
  const isUttarakhand =
    buyerState.toLowerCase().includes("uttarakhand") ||
    buyerState.toLowerCase().includes("ua");

  const subtotal = Number(order.subtotal || 0);
  const gstAmount = Number(order.gstAmount || subtotal * 0.18);
  const shippingFee = Number(order.shippingFee || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const totalAmount = Number(order.totalAmount || subtotal + gstAmount + shippingFee);

  // Split GST: CGST + SGST (9% each for Uttarakhand intra-state) vs IGST (18% inter-state)
  const cgstAmount = isUttarakhand ? Math.round(gstAmount / 2) : 0;
  const sgstAmount = isUttarakhand ? Math.round(gstAmount / 2) : 0;
  const igstAmount = isUttarakhand ? 0 : Math.round(gstAmount);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary py-6 sm:py-10 px-3 sm:px-6 selection:bg-brand-yellow selection:text-black print:bg-white print:text-black print:p-0 print:m-0">
      {/* Top Action Bar (Screen Only) */}
      <div className="max-w-[850px] mx-auto mb-6 flex items-center justify-between gap-4 print:hidden">
        <Link
          href="/account?tab=orders"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Orders</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-yellow hover:bg-[#FFE04D] text-black text-xs font-bold transition-all shadow-lg shadow-brand-yellow/10"
          >
            <Printer size={15} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Invoice Sheet (Clean, high-density A4 container) */}
      <div className="max-w-[850px] mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-200 print:border-none print:shadow-none print:rounded-none print:p-6 print:max-w-none print:w-full font-sans text-xs">
        {/* Header Block */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-2xl tracking-tighter text-slate-950 font-display">
                STAR PRESS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-300">
                Print Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-700 font-medium">
              Star Press Commercial Printing & Packaging Works
            </p>
            <p className="text-[11px] text-slate-600">
              Plot 12, Industrial Area, Tanakpur Road, Khatima, Uttarakhand - 262308
            </p>
            <p className="text-[11px] text-slate-800 font-semibold mt-1">
              GSTIN: <span className="font-mono">05AAACS1429B1Z8</span> &nbsp;|&nbsp; State: Uttarakhand (05)
            </p>
            <p className="text-[11px] text-slate-600">
              Email: orders@starpress.in &nbsp;|&nbsp; Web: www.starpress.in
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-950 text-white font-black text-xs uppercase tracking-wider rounded mb-2">
              TAX INVOICE
            </span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              (Original for Recipient)
            </p>
            <div className="mt-2 space-y-0.5">
              <p className="font-bold text-slate-900">
                Invoice No: <span className="font-mono">INV-{order.orderNumber}</span>
              </p>
              <p className="text-slate-600">
                Date: {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="text-slate-600">
                Order Ref: <span className="font-mono">{order.orderNumber}</span>
              </p>
              <p className="text-slate-600">
                Place of Supply: <span className="font-semibold">{buyerState}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Billing & Shipping Details Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Billed To (Customer Details):
            </p>
            {companyName && (
              <p className="font-bold text-slate-900 text-sm mb-0.5">{companyName}</p>
            )}
            <p className="font-semibold text-slate-900">{customerName}</p>
            <p className="text-slate-600 leading-snug">
              {[addr.line1 || addr.addressLine1, addr.line2 || addr.addressLine2, addr.city, addr.state, addr.pincode || addr.pinCode]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="text-slate-700 mt-1">Phone: {customerPhone}</p>
            <p className="text-slate-700">Email: {customerEmail}</p>
            {buyerGstin ? (
              <p className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded mt-1.5 inline-block font-mono text-[11px]">
                GSTIN: {buyerGstin}
              </p>
            ) : (
              <p className="text-slate-500 text-[10px] mt-1">GST Status: Unregistered Consumer</p>
            )}
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Dispatch & Payment Record:
            </p>
            <p className="text-slate-700">
              Payment Status: <span className="font-bold text-emerald-700 uppercase">{order.paymentStatus}</span>
            </p>
            <p className="text-slate-700">
              Payment Channel: <span className="font-medium">{order.paymentMethod || "Online / UPI"}</span>
            </p>
            {order.paymentId && (
              <p className="text-slate-600 text-[11px]">
                Gateway Ref: <span className="font-mono">{order.paymentId}</span>
              </p>
            )}
            <p className="text-slate-700 mt-2">
              Delivery Type: Standard Surface Dispatch
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Reverse Charge Applicable: <strong>NO</strong>
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left text-xs mb-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 text-[11px]">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Item Description & Specifications</th>
              <th className="py-2.5 px-2 text-center">HSN/SAC</th>
              <th className="py-2.5 px-2 text-center">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
              <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
              <th className="py-2.5 px-3 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((item, idx) => {
              const hsn = item.productName.toLowerCase().includes("box") || item.productName.toLowerCase().includes("packaging")
                ? "4819"
                : item.productName.toLowerCase().includes("label") || item.productName.toLowerCase().includes("sticker")
                ? "4821"
                : "4911";

              const specsStr = item.specs
                ? [
                    item.specs.sizeLabel ? `Size: ${item.specs.sizeLabel}` : null,
                    item.specs.materialLabel ? `Material: ${item.specs.materialLabel}` : null,
                  ]
                    .filter(Boolean)
                    .join(" | ")
                : null;

              return (
                <tr key={item.id} className="align-top">
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{item.productName}</p>
                    {specsStr && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{specsStr}</p>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600 text-[11px]">{hsn}</td>
                  <td className="py-3 px-2 text-center font-mono font-bold">{item.quantity}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    ₹{Number(item.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    ₹{Number(item.lineTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">
                    ₹{Number(item.lineTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}

            {shippingFee > 0 && (
              <tr className="align-top bg-slate-50/50">
                <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{order.items.length + 1}</td>
                <td className="py-2 px-3">
                  <p className="font-medium text-slate-800">Doorstep Courier Delivery & Protective Packaging</p>
                </td>
                <td className="py-2 px-2 text-center font-mono text-slate-600 text-[11px]">9968</td>
                <td className="py-2 px-2 text-center font-mono">1</td>
                <td className="py-2 px-3 text-right font-mono">
                  ₹{shippingFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 text-right font-mono">
                  ₹{shippingFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 text-right font-mono font-semibold">
                  ₹{shippingFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Calculations & GST Breakup */}
        <div className="border-t-2 border-slate-900 pt-4 flex flex-col sm:flex-row justify-between gap-6 mb-8">
          <div className="flex-1 space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Amount in Words:
              </p>
              <p className="font-bold text-slate-900 italic">
                {numberToWords(totalAmount)}
              </p>
            </div>

            <div className="text-[10px] text-slate-500 space-y-1">
              <p>• Goods once sold are customized to client specifications.</p>
              <p>• Official tax invoice generated electronically under Rule 48, CGST Rules 2017.</p>
              <p>• Eligible for Input Tax Credit (ITC) for business recipients with registered GSTIN.</p>
            </div>
          </div>

          <div className="w-full sm:w-72 space-y-1.5 text-xs">
            <div className="flex justify-between py-1 text-slate-700">
              <span>Taxable Value:</span>
              <span className="font-mono">
                ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-700">
                <span>Promotional Discount:</span>
                <span className="font-mono">
                  -₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {isUttarakhand ? (
              <>
                <div className="flex justify-between py-1 text-slate-700">
                  <span>CGST (9.0%):</span>
                  <span className="font-mono">
                    ₹{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-slate-700">
                  <span>SGST (9.0%):</span>
                  <span className="font-mono">
                    ₹{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between py-1 text-slate-700">
                <span>IGST (18.0%):</span>
                <span className="font-mono">
                  ₹{igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 text-slate-700">
              <span>Shipping Fee:</span>
              <span className="font-mono">
                {shippingFee > 0
                  ? `₹${shippingFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                  : "FREE"}
              </span>
            </div>

            <div className="flex justify-between py-2 border-t-2 border-slate-900 border-b-2 border-slate-900 font-black text-sm text-slate-950">
              <span>Total Invoice Value:</span>
              <span className="font-mono text-base">
                ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Sign-off Block */}
        <div className="border-t border-slate-200 pt-6 flex justify-between items-end">
          <div className="text-[10px] text-slate-500">
            <p className="font-bold text-slate-800">STAR PRESS PRINT STUDIO</p>
            <p>Khatima, Udham Singh Nagar, Uttarakhand - 262308</p>
            <p className="mt-1">For billing assistance: billing@starpress.in</p>
          </div>

          <div className="text-right space-y-1">
            <div className="inline-block border-b border-dashed border-slate-400 pb-1 px-4 mb-1">
              <span className="text-[11px] font-bold text-slate-800">
                Authorised Signatory
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Computer Generated Tax Invoice. No signature required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
