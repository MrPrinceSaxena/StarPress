"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck,
  ShoppingBag,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Lock,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  CreditCard,
  FileText,
  FileCheck,
  Building,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart, CartItem } from "@/context/CartContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/lib/supabase/client";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi NCR",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

interface SavedAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="checkout.razorpay.com"]'
    );
    if (existingScript) {
      if ((window as any).Razorpay) return resolve(true);
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, isLoaded } = useCart();
  const { session, status, isHydrated } = useAuthSession();

  // Active step: 1 (Cart), 2 (Details), 3 (Payment), 4 (Confirmation)
  const [currentStep, setCurrentStep] = useState<2 | 3 | 4>(2);

  // Address Form State
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Uttarakhand");
  const [pincode, setPincode] = useState("");
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showSavedAddressesModal, setShowSavedAddressesModal] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // Delivery & Notes State
  const [deliveryOption, setDeliveryOption] = useState<"standard" | "express">("standard");
  const [orderNotes, setOrderNotes] = useState("");

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod_proof">("online");

  // Optional GSTIN
  const [isGstRequired, setIsGstRequired] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Server Quote & In-Flight State
  const [serverQuote, setServerQuote] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [recoveryOrderId, setRecoveryOrderId] = useState<string | null>(null);

  // Confirmed Order Result
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    orderId: string;
    date: string;
    total: number;
    itemsCount: number;
    shippingMethod: string;
    paymentMethod: string;
    paymentStatus: string;
  } | null>(null);

  const idempotencyKeyRef = useRef<string>("");

  useEffect(() => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
  }, []);

  // Preload Razorpay checkout SDK
  useEffect(() => {
    loadRazorpayScript().catch(() => {});
  }, []);

  // Read URL coupon if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlCoupon = new URLSearchParams(window.location.search).get("coupon");
      if (urlCoupon && urlCoupon.trim()) {
        const clean = urlCoupon.trim().toUpperCase();
        setCouponCode(clean);
        setCouponInput(clean);
        setShowCouponInput(true);
      }
    }
  }, []);

  // Auto-fill user credentials when authenticated
  useEffect(() => {
    if (session?.user) {
      setFullName((prev) => prev || session.user.name || "");
      if (session.user.phone) {
        const raw = session.user.phone.replace("+91", "").trim();
        setPhoneNumber((prev) => prev || raw);
      }
    }
  }, [session]);

  // Fetch saved addresses for authenticated users
  useEffect(() => {
    async function loadAddresses() {
      if (!session?.user) return;
      setAddressLoading(true);
      try {
        let authToken: string | undefined;
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          authToken = sessionData?.session?.access_token;
        } catch {}

        const res = await fetch("/api/account/addresses", {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          if (data.addresses && Array.isArray(data.addresses) && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            const defaultAddr = data.addresses.find((a: SavedAddress) => a.isDefault) || data.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setAddressLine(defaultAddr.line1 || "");
            setCity(defaultAddr.city || "");
            setState(defaultAddr.state || "Uttarakhand");
            setPincode(defaultAddr.pincode || "");
            if (defaultAddr.phone) {
              setPhoneNumber(defaultAddr.phone.replace("+91", "").trim());
            }
          }
        }
      } catch {}
      setAddressLoading(false);
    }

    loadAddresses();
  }, [session]);

  // Fetch Authoritative Server Quote
  useEffect(() => {
    if (!items || items.length === 0) return;

    let isMounted = true;
    async function fetchQuote() {
      try {
        const quotePayload = {
          items: items.map((it) => ({
            productId: it.productId || it.id,
            slug: it.productSlug || it.href?.replace("/shop/", "") || "product",
            quantity: it.quantity,
            sizeId: it.sizeId,
            materialId: it.materialId,
            customText: it.customText || it.customizations?.personalizedText,
            artworkUrl: it.artworkUrl,
          })),
          couponCode: couponCode.trim() || undefined,
          shippingMethod: deliveryOption,
        };

        const res = await fetch("/api/orders/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quotePayload),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.quote) {
            setServerQuote(data.quote);
            if (data.quote.couponApplied) {
              setCouponFeedback({
                type: "success",
                msg: `Coupon "${data.quote.couponApplied.code}" applied: Saved ₹${data.quote.couponApplied.discountAmount}!`,
              });
            } else if (couponCode.trim()) {
              setCouponFeedback({
                type: "error",
                msg: "Coupon code was not applicable to items in your cart.",
              });
            }
          }
        }
      } catch {}
    }

    fetchQuote();
    return () => {
      isMounted = false;
    };
  }, [items, deliveryOption, couponCode]);

  // Exact pricing derived from server quote or calculated fallback
  const standardDeliveryFee = 40;
  const expressDeliveryFee = 80;
  const deliveryCharge = deliveryOption === "express" ? expressDeliveryFee : standardDeliveryFee;

  const gstAmount = serverQuote ? serverQuote.gst : Math.round(subtotal * 0.18);
  const discountAmount = serverQuote ? serverQuote.discount : 0;
  const grandTotal = serverQuote
    ? serverQuote.grandTotal
    : Math.max(0, subtotal - discountAmount) + deliveryCharge + gstAmount;

  // Select Saved Address
  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setAddressLine(addr.line1 || "");
    setCity(addr.city || "");
    setState(addr.state || "Uttarakhand");
    setPincode(addr.pincode || "");
    if (addr.phone) {
      setPhoneNumber(addr.phone.replace("+91", "").trim());
    }
    setShowSavedAddressesModal(false);
  };

  // Coupon application handler
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponFeedback(null);
    if (!couponInput.trim()) return;
    setCouponCode(couponInput.trim().toUpperCase());
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponInput("");
    setCouponFeedback(null);
  };

  // Validate Step 2 (Details)
  const validateDetails = (): boolean => {
    setCheckoutError(null);
    if (!fullName.trim()) {
      setCheckoutError("Please enter your Full Name.");
      return false;
    }
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setCheckoutError("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (!addressLine.trim()) {
      setCheckoutError("Please enter your complete delivery address.");
      return false;
    }
    if (!city.trim()) {
      setCheckoutError("Please enter your city.");
      return false;
    }
    const cleanPin = pincode.replace(/\D/g, "");
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setCheckoutError("Please enter a valid 6-digit Indian PIN code.");
      return false;
    }
    return true;
  };

  // Proceed button click
  const handleProceedClick = () => {
    if (currentStep === 2) {
      if (validateDetails()) {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (currentStep === 3) {
      handlePlaceOrder();
    }
  };

  // Place Order Action
  const handlePlaceOrder = async () => {
    if (!validateDetails()) {
      setCurrentStep(2);
      return;
    }

    setCheckoutError(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const clientEmail = session?.user?.email || "customer@starpress.in";
      const cleanPhone = phoneNumber.replace(/\D/g, "").slice(-10);
      const fullPhone = `+91 ${cleanPhone}`;

      setStatusMessage("Registering print specifications on server...");

      const payload = {
        userId: session?.user?.id || undefined,
        guestEmail: clientEmail,
        guestPhone: fullPhone,
        guestName: fullName.trim(),
        shippingAddress: {
          fullName: fullName.trim(),
          phone: fullPhone,
          email: clientEmail,
          addressLine1: addressLine.trim(),
          city: city.trim(),
          state: state,
          pincode: pincode.trim(),
        },
        billingAddress: isGstRequired
          ? {
              companyName: companyName.trim() || fullName.trim(),
              gstin: gstin.toUpperCase().trim(),
              addressLine1: addressLine.trim(),
              city: city.trim(),
              state: state,
              pincode: pincode.trim(),
            }
          : undefined,
        shippingMethod: deliveryOption,
        couponCode: couponCode.trim() || undefined,
        paymentMethod: paymentMethod === "online" ? "ONLINE" : "PAY_AFTER_PROOF",
        notes: orderNotes.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId || it.id,
          productSlug: it.productSlug || it.href?.replace("/shop/", "") || "product",
          quantity: it.quantity,
          sizeId: it.sizeId,
          materialId: it.materialId,
          customText: it.customText || it.customizations?.personalizedText,
          artworkUrl: it.artworkUrl,
          previewUrl: it.imageSrc,
        })),
      };

      let authToken: string | undefined;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        authToken = sessionData?.session?.access_token;
      } catch {}

      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };

      // 1. Create order on server
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        body: JSON.stringify(payload),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.order) {
        throw new Error(
          orderData.error || "Failed to create order on server. Please verify your details."
        );
      }

      const placedOrder = orderData.order;

      // 2. Pay After Proof / Free Order flow
      if (paymentMethod !== "online" || Number(placedOrder.totalAmount) <= 0) {
        clearCart();
        setConfirmedOrder({
          id: placedOrder.id,
          orderId: placedOrder.orderNumber,
          date: new Date(placedOrder.createdAt || Date.now()).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          total: Number(placedOrder.totalAmount),
          itemsCount: items.reduce((acc, it) => acc + it.quantity, 0),
          shippingMethod: deliveryOption,
          paymentMethod: paymentMethod === "online" ? "100%_DISCOUNT" : "PAY_AFTER_PROOF",
          paymentStatus: Number(placedOrder.totalAmount) <= 0 ? "PAID" : "UNPAID",
        });
        setCurrentStep(4);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // 3. Online Razorpay Payment flow
      setStatusMessage("Launching secure Razorpay payment modal...");
      const razorpayResponse = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ orderId: placedOrder.id }),
      });

      const rzpData = await razorpayResponse.json();
      if (!razorpayResponse.ok || !rzpData.razorpayOrderId) {
        throw new Error(rzpData.error || "Payment gateway unavailable. Please retry or choose Pay After Proof.");
      }

      // Non-production test mock order simulation
      if (rzpData.isMock) {
        setStatusMessage("Completing simulated test payment...");
        const verifyRes = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            orderId: placedOrder.id,
            razorpay_order_id: rzpData.razorpayOrderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: "mock_test_signature",
          }),
        });

        const vData = await verifyRes.json();
        if (verifyRes.ok && vData.success) {
          clearCart();
          setConfirmedOrder({
            id: placedOrder.id,
            orderId: placedOrder.orderNumber,
            date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            total: Number(placedOrder.totalAmount),
            itemsCount: items.reduce((acc, it) => acc + it.quantity, 0),
            shippingMethod: deliveryOption,
            paymentMethod: "ONLINE (Test Simulated)",
            paymentStatus: "PAID",
          });
          setCurrentStep(4);
          setIsSubmitting(false);
          setStatusMessage(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        throw new Error(vData.error || "Mock payment verification failed.");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay payment SDK. Please check your network connection.");
      }

      const options = {
        key: rzpData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_Toz86Nohgur7MU",
        amount: rzpData.amount,
        currency: rzpData.currency || "INR",
        name: "Star Press",
        description: `Print Order #${placedOrder.orderNumber}`,
        order_id: rzpData.razorpayOrderId,
        prefill: {
          name: fullName.trim(),
          email: clientEmail,
          contact: cleanPhone,
        },
        theme: {
          color: "#4F46E5",
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setStatusMessage(null);
            setRecoveryOrderId(placedOrder.id);
            setCheckoutError(
              "Payment window was closed before completion. Your order has been preserved — you can retry payment whenever ready."
            );
          },
          escape: true,
          backdropclose: false,
        },
        handler: async function (response: any) {
          setIsSubmitting(true);
          setStatusMessage("Verifying payment capture with server...");

          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({
                orderId: placedOrder.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const vData = await verifyRes.json();
            if (!verifyRes.ok || !vData.success) {
              throw new Error(
                vData.error || "Payment verification failed. If money was debited, your order will confirm automatically shortly."
              );
            }

            clearCart();
            setConfirmedOrder({
              id: placedOrder.id,
              orderId: placedOrder.orderNumber,
              date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
              total: Number(placedOrder.totalAmount),
              itemsCount: items.reduce((acc, it) => acc + it.quantity, 0),
              shippingMethod: deliveryOption,
              paymentMethod: "ONLINE",
              paymentStatus: "PAID",
            });
            setCurrentStep(4);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } catch (vErr: any) {
            console.error("Payment verification error:", vErr);
            setRecoveryOrderId(placedOrder.id);
            setCheckoutError(vErr.message);
          } finally {
            setIsSubmitting(false);
            setStatusMessage(null);
          }
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", function (resp: any) {
        setIsSubmitting(false);
        setStatusMessage(null);
        setRecoveryOrderId(placedOrder.id);
        setCheckoutError(
          resp.error?.description || "Payment failed at card/bank network. Please retry or choose Pay After Proof."
        );
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("Error during checkout:", err);
      setCheckoutError(err.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
      setStatusMessage(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F8F9FD]">
        <Header />
        <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-24 text-center">
          <div className="inline-block w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">Preparing secure checkout...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Empty cart view
  if (items.length === 0 && !confirmedOrder) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F8F9FD]">
        <Header />
        <main className="flex-1 max-w-[600px] w-full mx-auto px-6 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <ShoppingBag size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Your Shopping Cart is Empty</h1>
          <p className="text-sm text-slate-500 mb-8">
            Add custom visiting cards, illuminated name plates, neon boards, or marketing prints to get started.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20"
          >
            <span>Explore Custom Prints</span>
            <ArrowRight size={16} />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F5F9] relative text-slate-800 selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Step 4: Confirmed Order View */}
        {currentStep === 4 && confirmedOrder ? (
          <div className="max-w-[760px] mx-auto space-y-6">
            {/* Top Stepper for Confirmation */}
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Order Confirmed!</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Thank you for your business. Your order is registered and in production.
              </p>
              <div className="flex items-center justify-center gap-3 sm:gap-6 mt-6 max-w-[480px] mx-auto text-xs">
                <div className="flex items-center gap-2 font-medium text-indigo-600">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">✓</span>
                  <span>Cart</span>
                </div>
                <div className="h-0.5 bg-indigo-600 flex-1" />
                <div className="flex items-center gap-2 font-medium text-indigo-600">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">✓</span>
                  <span>Details</span>
                </div>
                <div className="h-0.5 bg-indigo-600 flex-1" />
                <div className="flex items-center gap-2 font-medium text-indigo-600">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">✓</span>
                  <span>Payment</span>
                </div>
                <div className="h-0.5 bg-indigo-600 flex-1" />
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-indigo-100">4</span>
                  <span>Confirmation</span>
                </div>
              </div>
            </div>

            {/* Confirmed Details Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-slate-100 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold font-mono tracking-wide mb-2">
                  Order #{confirmedOrder.orderId}
                </span>
                <h2 className="text-xl font-bold text-slate-900">Order Placed Successfully</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-[480px] mx-auto">
                  A confirmation summary has been registered for {fullName}. Our pre-press specialists are preparing your digital production proof.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 text-left border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Date</span>
                  <span className="font-semibold text-slate-800">{confirmedOrder.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total</span>
                  <span className="font-semibold text-slate-800">₹{confirmedOrder.total.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment</span>
                  <span className="font-semibold text-slate-800">
                    {confirmedOrder.paymentMethod === "PAY_AFTER_PROOF" ? "Pay After Proof" : "Online Paid"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {confirmedOrder.shippingMethod === "express" ? "Express (1-3 days)" : "Standard (3-7 days)"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href={`/orders/track?orderId=${confirmedOrder.orderId}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/20"
                >
                  Track Order Live →
                </Link>
                <Link
                  href="/shop"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header Title & Subtitle matching Mockup */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Checkout & Delivery
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Complete your order in a few simple steps
              </p>

              {/* Progress Stepper matching Mockup exactly */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6 max-w-[460px] mx-auto text-xs">
                {/* Step 1: Cart */}
                <Link href="/cart" className="flex items-center gap-1.5 font-medium text-indigo-600 hover:underline">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-indigo-500/20">
                    1
                  </span>
                  <span className="hidden sm:inline">Cart</span>
                </Link>

                <div className="h-0.5 bg-indigo-600 flex-1 max-w-[60px]" />

                {/* Step 2: Details */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={`flex items-center gap-1.5 font-semibold transition-colors ${
                    currentStep === 2 ? "text-slate-900" : "text-indigo-600"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      currentStep === 2
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    2
                  </span>
                  <span className={currentStep === 2 ? "font-bold text-slate-900" : ""}>Details</span>
                </button>

                <div className={`h-0.5 flex-1 max-w-[60px] transition-colors ${
                  currentStep >= 3 ? "bg-indigo-600" : "bg-slate-200"
                }`} />

                {/* Step 3: Payment */}
                <button
                  type="button"
                  onClick={() => {
                    if (validateDetails()) setCurrentStep(3);
                  }}
                  className={`flex items-center gap-1.5 transition-colors ${
                    currentStep === 3 ? "font-bold text-slate-900" : "text-slate-400"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      currentStep === 3
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    3
                  </span>
                  <span>Payment</span>
                </button>

                <div className="h-0.5 bg-slate-200 flex-1 max-w-[60px]" />

                {/* Step 4: Confirmation */}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                    4
                  </span>
                  <span className="hidden sm:inline">Confirmation</span>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {checkoutError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-900">Checkout Notice</p>
                    <p>{checkoutError}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("cod_proof");
                      setCurrentStep(3);
                      setCheckoutError(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-rose-200 shadow-2xs transition-colors"
                  >
                    Select Pay After Proof
                  </button>
                  {recoveryOrderId && (
                    <Link
                      href={`/account/orders/${recoveryOrderId}/pay`}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Retry Payment Securely →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* In-Flight Status Notice */}
            {statusMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
                <Loader2 size={16} className="animate-spin text-indigo-600 shrink-0" />
                <span className="font-medium">{statusMessage}</span>
              </div>
            )}

            {/* Main 2-Column Grid matching Mockup */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* LEFT COLUMN: Delivery Details & Delivery Options */}
              <div className="lg:col-span-7 space-y-6">
                {currentStep === 2 ? (
                  <>
                    {/* 1. Delivery Details Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Truck size={19} />
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-slate-900 leading-tight">
                              Delivery Details
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Where should we deliver your order?
                            </p>
                          </div>
                        </div>

                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowSavedAddressesModal(true)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline shrink-0"
                          >
                            Saved Addresses ({savedAddresses.length})
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Row 1: Full Name & Phone Number */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              Full Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="e.g. Prince Saxena"
                              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              Phone Number <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex items-center h-11 rounded-xl border border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden">
                              <div className="flex items-center gap-1.5 px-3 bg-slate-50 border-r border-slate-200 text-xs font-semibold text-slate-700 select-none">
                                <span>🇮🇳</span>
                                <ChevronDown size={13} className="text-slate-400" />
                                <span>+91</span>
                              </div>
                              <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                placeholder="98765 43210"
                                className="w-full h-full px-3.5 bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Address */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Address <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={addressLine}
                            onChange={(e) => setAddressLine(e.target.value)}
                            placeholder="House / Flat / Building / Street"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                          />
                        </div>

                        {/* Row 3: City, State, PIN Code (3 columns) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              City <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="Enter city"
                              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              State <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <select
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="w-full h-11 px-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 appearance-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                              >
                                {INDIAN_STATES.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              PIN Code <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={pincode}
                              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="Enter PIN code"
                              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                            />
                          </div>
                        </div>

                        {/* Save Address Checkbox */}
                        <div className="pt-1">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={saveAddressForFuture}
                              onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-xs text-slate-600 font-medium">
                              Save this address for future orders
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* 2. Delivery Options Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] border border-slate-100 space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Truck size={19} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-900 leading-tight">
                            Delivery Options
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Choose a delivery option that works for you
                          </p>
                        </div>
                      </div>

                      {/* 2 Option Cards side-by-side */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Standard Delivery */}
                        <div
                          onClick={() => setDeliveryOption("standard")}
                          className={`relative p-4.5 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
                            deliveryOption === "standard"
                              ? "border-2 border-indigo-500 bg-indigo-50/20 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  deliveryOption === "standard"
                                    ? "border-indigo-600"
                                    : "border-slate-300"
                                }`}
                              >
                                {deliveryOption === "standard" && (
                                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight">
                                Standard Delivery
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">3–7 business days</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-900">₹{standardDeliveryFee}</span>
                        </div>

                        {/* Express Delivery */}
                        <div
                          onClick={() => setDeliveryOption("express")}
                          className={`relative p-4.5 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
                            deliveryOption === "express"
                              ? "border-2 border-indigo-500 bg-indigo-50/20 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600">
                            Recommended
                          </span>
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  deliveryOption === "express"
                                    ? "border-indigo-600"
                                    : "border-slate-300"
                                }`}
                              >
                                {deliveryOption === "express" && (
                                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight">
                                Express Delivery
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">1–3 business days</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-900">₹{expressDeliveryFee}</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Order Notes Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-900 leading-tight">
                            Order Notes <span className="text-xs font-normal text-slate-400">(Optional)</span>
                          </h2>
                        </div>
                      </div>

                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Any special instructions for your order..."
                        rows={2}
                        className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                      />
                    </div>
                  </>
                ) : (
                  /* Step 3: Payment Method Selection */
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <CreditCard size={19} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-slate-900 leading-tight">
                            Select Payment Method
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Deliver to {fullName} • {city}, {pincode}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        Edit Details
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Option 1: Online Payment */}
                      <div
                        onClick={() => setPaymentMethod("online")}
                        className={`p-5 rounded-2xl cursor-pointer border transition-all ${
                          paymentMethod === "online"
                            ? "border-2 border-indigo-500 bg-indigo-50/20 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  paymentMethod === "online" ? "border-indigo-600" : "border-slate-300"
                                }`}
                              >
                                {paymentMethod === "online" && (
                                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-900">
                                  Online Payment (UPI, Cards, NetBanking)
                                </p>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                  FASTEST
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Instant automated gateway payment via Google Pay, PhonePe, Paytm, RuPay, Visa, Mastercard, and NetBanking.
                              </p>
                            </div>
                          </div>
                          <Lock size={16} className="text-indigo-600 shrink-0" />
                        </div>
                      </div>

                      {/* Option 2: Pay After Proof (Approval / COD) */}
                      <div
                        onClick={() => setPaymentMethod("cod_proof")}
                        className={`p-5 rounded-2xl cursor-pointer border transition-all ${
                          paymentMethod === "cod_proof"
                            ? "border-2 border-indigo-500 bg-indigo-50/20 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  paymentMethod === "cod_proof" ? "border-indigo-600" : "border-slate-300"
                                }`}
                              >
                                {paymentMethod === "cod_proof" && (
                                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                Pay After Digital Proof Approval
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Our design team sends your final print proof on WhatsApp before printing starts. Pay securely upon your full approval.
                              </p>
                            </div>
                          </div>
                          <FileCheck size={16} className="text-slate-400 shrink-0" />
                        </div>
                      </div>
                    </div>

                    {/* B2B GSTIN Toggle */}
                    <div className="pt-4 border-t border-slate-100">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isGstRequired}
                          onChange={(e) => setIsGstRequired(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Building size={14} className="text-slate-400" />
                          I need a GST invoice for my business
                        </span>
                      </label>

                      {isGstRequired && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-600">Company Legal Name</label>
                            <input
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              placeholder="e.g. Star Press Pvt Ltd"
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-600">15-Digit GSTIN</label>
                            <input
                              type="text"
                              value={gstin}
                              onChange={(e) => setGstin(e.target.value.toUpperCase())}
                              placeholder="07AAAAA0000A1Z5"
                              maxLength={15}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono uppercase text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Order Summary & Trust Badges */}
              <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
                {/* 1. Order Summary Card matching Mockup */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] border border-slate-100 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <ShoppingBag size={17} />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">Order Summary</h2>
                    </div>
                    <Link
                      href="/cart"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      Edit Cart
                    </Link>
                  </div>

                  {/* Cart Items List matching Mockup */}
                  <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                    {items.map((item, idx) => {
                      const sizeLabel = item.specs?.sizeLabel || (item.sizeId ? `Size: ${item.sizeId}` : null);
                      const materialLabel = item.specs?.materialLabel || (item.materialId ? item.materialId : null);
                      const customText = item.customText || item.customizations?.personalizedText;

                      return (
                        <div key={item.id || idx} className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              <Image
                                src={item.imageSrc || "/images/placeholder.png"}
                                alt={item.name || "Custom Print"}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                                {item.name || "Custom Print"}
                              </p>
                              {customText && (
                                <p className="text-[11px] text-slate-500 font-medium truncate max-w-[160px]">
                                  {customText}
                                </p>
                              )}
                              {sizeLabel && (
                                <p className="text-[11px] text-slate-500">{sizeLabel}</p>
                              )}
                              {materialLabel && (
                                <p className="text-[11px] text-slate-500">{materialLabel}</p>
                              )}
                              <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                            </div>
                          </div>

                          <span className="text-xs sm:text-sm font-bold text-slate-900 shrink-0">
                            ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Promo Code Input Toggle */}
                  <div className="pt-2">
                    {!showCouponInput && !couponCode ? (
                      <button
                        type="button"
                        onClick={() => setShowCouponInput(true)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
                      >
                        <Tag size={13} />
                        <span>Have a promo code?</span>
                      </button>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="PROMO CODE"
                            className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-xs font-mono uppercase text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="submit"
                            className="h-9 px-3.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                        {couponFeedback && (
                          <p
                            className={`text-[11px] font-medium ${
                              couponFeedback.type === "success" ? "text-emerald-600" : "text-rose-500"
                            }`}
                          >
                            {couponFeedback.msg}
                          </p>
                        )}
                        {couponCode && (
                          <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <span>Code {couponCode} active</span>
                            <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </form>
                    )}
                  </div>

                  {/* Price Breakdown matching Mockup */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-800">
                        ₹{subtotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Delivery Charge</span>
                      <span className="font-semibold text-slate-800">
                        ₹{deliveryCharge.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Tax (GST)</span>
                      <span className="font-semibold text-slate-800">
                        ₹{gstAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600">
                        <span>Discount Savings</span>
                        <span className="font-semibold">-₹{discountAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">Total Amount</span>
                      <span className="text-xl font-extrabold text-slate-900">
                        ₹{grandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Primary Call to Action Button */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleProceedClick}
                      className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Processing Secure Order...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {currentStep === 2
                              ? "Proceed to Payment →"
                              : paymentMethod === "online"
                              ? `Place Order & Pay ₹${grandTotal.toLocaleString("en-IN")}`
                              : `Confirm Order (Pay After Proof)`}
                          </span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                      <Lock size={12} className="text-slate-400" />
                      <span>Secure payment powered by Razorpay</span>
                    </div>
                  </div>
                </div>

                {/* 2. Trust Badges Card matching Mockup 2x2 grid */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)]">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Badge 1 */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">Secure Payments</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">100% safe & encrypted</p>
                      </div>
                    </div>

                    {/* Badge 2 */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Truck size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">Fast Delivery</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Pan India shipping</p>
                      </div>
                    </div>

                    {/* Badge 3 */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">Premium Quality</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Custom prints with care</p>
                      </div>
                    </div>

                    {/* Badge 4 */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <RotateCcw size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">Easy Returns</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Hassle free support</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />

      {/* Saved Addresses Modal */}
      {showSavedAddressesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Select Delivery Address</h3>
              <button
                type="button"
                onClick={() => setShowSavedAddressesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => handleSelectSavedAddress(addr)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedAddressId === addr.id
                      ? "border-2 border-indigo-600 bg-indigo-50/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{addr.line1}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Phone: {addr.phone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}