"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  CreditCard,
  FileCheck,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  Loader2,
  RefreshCw,
  Tag,
  MapPin,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Building,
  Phone,
  Mail,
  User,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { useCart, CartItem } from "@/context/CartContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/lib/supabase/client";

const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi NCR",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
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

function getEstimatedDate(daysToAdd: number): string {
  const target = new Date();
  target.setDate(target.getDate() + daysToAdd);
  return target.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, isLoaded } = useCart();
  const { session, status, isHydrated } = useAuthSession();

  // Active Accordion Step: 1 (Address), 2 (Shipping), 3 (Payment), 4 (Review & Place)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Address Form (for new or editing)
  const [addressFormData, setAddressFormData] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "Delhi NCR",
    isDefault: false,
    label: "Home / Office",
  });

  // Shipping & Payment Options
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod_proof">("online");

  // B2B GST Invoicing
  const [isGstRequired, setIsGstRequired] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");

  // Customer Contact for Guests / Confirmation
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Server Quote & Submission State
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

  const [pollTimeoutReached, setPollTimeoutReached] = useState(false);
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

  // Read URL coupon
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlCoupon = new URLSearchParams(window.location.search).get("coupon");
      if (urlCoupon && urlCoupon.trim()) {
        const clean = urlCoupon.trim().toUpperCase();
        setCouponCode(clean);
        setCouponInput(clean);
      }
    }
  }, []);

  // Auto-fill user email & name if logged in
  useEffect(() => {
    if (session?.user) {
      setContactEmail((prev) => prev || session.user.email || "");
      setContactPhone((prev) => prev || session.user.phone || "");
      setAddressFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || session.user.name || "",
        phone: prev.phone || session.user.phone || "",
      }));
    }
  }, [session]);

  // Fetch saved addresses from backend
  const fetchAddresses = async () => {
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
          if (!selectedAddressId) {
            setSelectedAddressId(defaultAddr.id);
          }
          setIsAddingNewAddress(false);
        } else {
          setSavedAddresses([]);
          setIsAddingNewAddress(true);
        }
      } else {
        setIsAddingNewAddress(true);
      }
    } catch {
      setIsAddingNewAddress(true);
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchAddresses();
    } else {
      setIsAddingNewAddress(true);
    }
  }, [session]);

  // Selected address object
  const currentSelectedAddress = useMemo(() => {
    if (!savedAddresses.length) return null;
    return savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];
  }, [savedAddresses, selectedAddressId]);

  // Synchronize contact phone with selected address phone
  useEffect(() => {
    if (currentSelectedAddress?.phone && !contactPhone) {
      setContactPhone(currentSelectedAddress.phone);
    }
  }, [currentSelectedAddress, contactPhone]);

  // Enforce Authentication
  useEffect(() => {
    if (isHydrated && status === "unauthenticated") {
      router.replace("/login?callbackUrl=/checkout");
    }
  }, [isHydrated, status, router]);

  // Fetch authoritative server quote whenever items, shipping, or coupon change
  useEffect(() => {
    if (!items || items.length === 0) return;

    let cancelled = false;

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
          shippingMethod: shippingMethod,
        };

        const res = await fetch("/api/orders/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quotePayload),
        });

        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.quote) {
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
      cancelled = true;
    };
  }, [items, shippingMethod, couponCode]);

  // Price calculations
  const gstAmount = serverQuote ? serverQuote.gst : Math.round(subtotal * 0.18);
  const shippingFee = serverQuote
    ? serverQuote.shipping
    : (subtotal >= 999 ? 0 : 99) + (shippingMethod === "express" ? 249 : 0);
  const discountAmount = serverQuote ? serverQuote.discount : 0;
  const grandTotal = serverQuote
    ? serverQuote.grandTotal
    : Math.max(0, subtotal - discountAmount) + gstAmount + shippingFee;

  // Poll order status if awaiting verification
  useEffect(() => {
    const targetOrderId = confirmedOrder?.id || recoveryOrderId;
    if (!targetOrderId) return;
    if (confirmedOrder && confirmedOrder.paymentStatus === "PAID") return;

    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/orders/${targetOrderId}`);
        if (res.ok) {
          const data = await res.json();
          const pStatus = (data.order?.paymentStatus || "").toUpperCase();
          if (pStatus === "PAID") {
            clearCart();
            setConfirmedOrder({
              id: data.order.id,
              orderId: data.order.orderNumber,
              date: new Date(data.order.createdAt || Date.now()).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              total: Number(data.order.totalAmount),
              itemsCount: data.order.items?.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0) || items.length,
              shippingMethod: data.order.shippingMethod || "standard",
              paymentMethod: "ONLINE",
              paymentStatus: "PAID",
            });
            setCheckoutError(null);
            setRecoveryOrderId(null);
            clearInterval(interval);
            return;
          }
        }
      } catch {}

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPollTimeoutReached(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [confirmedOrder, recoveryOrderId, items.length, clearCart]);

  // Address CRUD actions
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);

    const pin = addressFormData.pincode.replace(/\D/g, "").slice(0, 6);
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setAddressError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    if (!addressFormData.line1.trim() || !addressFormData.city.trim()) {
      setAddressError("Please fill out your house/building details and city.");
      return;
    }

    const cleanedPhone = addressFormData.phone.replace(/[^\d+]/g, "").slice(0, 15);
    if (!cleanedPhone || cleanedPhone.length < 10) {
      setAddressError("Please enter a valid 10-digit mobile number for dispatch updates.");
      return;
    }

    try {
      let authToken: string | undefined;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        authToken = sessionData?.session?.access_token;
      } catch {}

      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      };

      if (editingAddressId) {
        // Update existing address
        const res = await fetch("/api/account/addresses", {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({
            id: editingAddressId,
            label: addressFormData.label,
            line1: addressFormData.line1,
            line2: addressFormData.line2 ? `${addressFormData.line2}${addressFormData.landmark ? `, Near ${addressFormData.landmark}` : ""}` : addressFormData.landmark || null,
            city: addressFormData.city,
            state: addressFormData.state,
            pincode: pin,
            phone: cleanedPhone,
            isDefault: addressFormData.isDefault,
          }),
        });

        if (!res.ok) throw new Error("Failed to update address.");
        await fetchAddresses();
        setSelectedAddressId(editingAddressId);
        setEditingAddressId(null);
        setIsAddingNewAddress(false);
      } else {
        // Create new address
        const res = await fetch("/api/account/addresses", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            label: addressFormData.label || addressFormData.fullName || "Delivery Address",
            line1: addressFormData.line1,
            line2: addressFormData.line2 ? `${addressFormData.line2}${addressFormData.landmark ? `, Near ${addressFormData.landmark}` : ""}` : addressFormData.landmark || null,
            city: addressFormData.city,
            state: addressFormData.state,
            pincode: pin,
            phone: cleanedPhone,
            isDefault: addressFormData.isDefault || savedAddresses.length === 0,
          }),
        });

        if (!res.ok) throw new Error("Failed to save address.");
        const data = await res.json();
        await fetchAddresses();
        if (data.address?.id) {
          setSelectedAddressId(data.address.id);
        }
        setIsAddingNewAddress(false);
      }
    } catch (err: any) {
      setAddressError(err.message || "Failed to save address. Please check your inputs.");
    }
  };

  const startEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setIsAddingNewAddress(true);
    setAddressFormData({
      fullName: session?.user?.name || "",
      phone: addr.phone || "",
      pincode: addr.pincode || "",
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      landmark: "",
      city: addr.city || "",
      state: addr.state || "Delhi NCR",
      isDefault: addr.isDefault || false,
      label: addr.label || "Delivery Address",
    });
  };

  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this delivery address?")) return;

    try {
      let authToken: string | undefined;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        authToken = sessionData?.session?.access_token;
      } catch {}

      await fetch(`/api/account/addresses?id=${id}`, {
        method: "DELETE",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      await fetchAddresses();
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
    } catch {}
  };

  // Coupon handling
  const applyCouponCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponFeedback(null);
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;
    setCouponCode(clean);
  };

  const removeCouponCode = () => {
    setCouponCode("");
    setCouponInput("");
    setCouponFeedback(null);
  };

  // Place Order Action
  const handlePlaceOrder = async () => {
    setCheckoutError(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const activeAddress = currentSelectedAddress || {
        line1: addressFormData.line1,
        line2: addressFormData.line2,
        city: addressFormData.city,
        state: addressFormData.state,
        pincode: addressFormData.pincode,
        phone: addressFormData.phone,
        label: addressFormData.label,
      };

      if (!activeAddress.line1 || !activeAddress.city || !activeAddress.pincode) {
        setActiveStep(1);
        throw new Error("Please select or enter a valid delivery address.");
      }

      const clientName = session?.user?.name || addressFormData.fullName || "Valued Customer";
      const clientEmail = session?.user?.email || contactEmail;
      const clientPhone = activeAddress.phone || contactPhone || session?.user?.phone || "";

      if (!clientEmail) {
        throw new Error("Email address is required to receive production proofs and order confirmation.");
      }

      setStatusMessage("Registering print specifications on server...");

      const payload = {
        userId: session?.user?.id || undefined,
        guestEmail: clientEmail,
        guestPhone: clientPhone,
        guestName: clientName,
        shippingAddress: {
          fullName: clientName,
          phone: clientPhone,
          email: clientEmail,
          companyName: companyName || undefined,
          addressLine1: activeAddress.line1,
          addressLine2: activeAddress.line2 || undefined,
          city: activeAddress.city,
          state: activeAddress.state,
          pincode: activeAddress.pincode,
        },
        billingAddress: isGstRequired
          ? {
              companyName: companyName || clientName,
              gstin: gstin.toUpperCase(),
              addressLine1: activeAddress.line1,
              city: activeAddress.city,
              state: activeAddress.state,
              pincode: activeAddress.pincode,
            }
          : undefined,
        shippingMethod: shippingMethod,
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

      // Zero total / 100% coupon edge case
      if (Number(placedOrder.totalAmount) <= 0) {
        clearCart();
        setConfirmedOrder({
          id: placedOrder.id,
          orderId: placedOrder.orderNumber,
          date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
          total: 0,
          itemsCount: items.reduce((acc, it) => acc + it.quantity, 0),
          shippingMethod: shippingMethod,
          paymentMethod: "100%_DISCOUNT",
          paymentStatus: "PAID",
        });
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Pay After Proof
      if (paymentMethod !== "online" && placedOrder.paymentMethod === "PAY_AFTER_PROOF") {
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
          shippingMethod: shippingMethod,
          paymentMethod: "PAY_AFTER_PROOF",
          paymentStatus: "UNPAID",
        });
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Online Razorpay Payment
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

      // Dev Mock Payment Handler (Non-production testing)
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
            shippingMethod: shippingMethod,
            paymentMethod: "ONLINE (Test Simulated)",
            paymentStatus: "PAID",
          });
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

      const cleanedPhone = clientPhone.replace(/[^\d+]/g, "").slice(0, 15);

      const options = {
        key: rzpData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_Toz86Nohgur7MU",
        amount: rzpData.amount,
        currency: rzpData.currency || "INR",
        name: "Star Press",
        description: `Print Order #${placedOrder.orderNumber}`,
        order_id: rzpData.razorpayOrderId,
        prefill: {
          name: clientName,
          email: clientEmail,
          contact: cleanedPhone,
        },
        theme: {
          color: "#FFCF1B",
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setStatusMessage(null);
            setRecoveryOrderId(placedOrder.id);
            setCheckoutError(
              "Payment window was closed before completion. Your order has been preserved — you may retry payment whenever you are ready."
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
                vData.error || "Payment verification failed. If money was debited, your order will confirm automatically via webhook."
              );
            }

            clearCart();
            setConfirmedOrder({
              id: placedOrder.id,
              orderId: placedOrder.orderNumber,
              date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
              total: Number(placedOrder.totalAmount),
              itemsCount: items.reduce((acc, it) => acc + it.quantity, 0),
              shippingMethod: shippingMethod,
              paymentMethod: "ONLINE",
              paymentStatus: "PAID",
            });
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
          resp.error?.description || "Payment failed at card/bank network. Please retry with another payment method."
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
      <div className="flex min-h-screen flex-col bg-bg-base text-text-primary">
        <Header />
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-20 text-center text-text-secondary">
          <div className="inline-block w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin mb-4" />
          <p>Preparing secure checkout...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (isHydrated && status === "unauthenticated") {
    return null;
  }

  // Confirmation View
  if (confirmedOrder) {
    const isPaid = confirmedOrder.paymentStatus === "PAID";
    const whatsappProofMsg = encodeURIComponent(
      `Hi Star Press team! I placed Order #${confirmedOrder.orderId} for ₹${confirmedOrder.total.toLocaleString(
        "en-IN"
      )}. Please confirm receipt of my artwork and send the digital pre-press proof.`
    );

    return (
      <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
        <Header />
        <main className="flex-1 max-w-[800px] w-full mx-auto px-6 py-12 md:py-20">
          <div className="rounded-3xl border border-emerald-500/30 bg-bg-surface p-8 sm:p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                {isPaid ? "Payment Verified • Order Confirmed" : "Order Placed • Pre-Press Proof Required"}
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
                {isPaid ? "Thank You for Printing with Star Press!" : "Order Queued for Pre-Press Proofing!"}
              </h1>
              <p className="text-sm text-text-secondary max-w-lg mx-auto">
                {isPaid
                  ? "Your payment is verified and your print order is queued directly into our press workflow."
                  : "Your print order has been received. Our pre-flight team will inspect your resolution and bleeds before final production."}
              </p>
            </div>

            {/* Order Details Receipt Box */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface-alt p-6 text-left space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <span className="text-xs text-text-secondary">Order Reference</span>
                <span className="font-mono font-black text-brand-yellow text-base">
                  {confirmedOrder.orderId}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Order Date</span>
                <span className="text-white font-medium">{confirmedOrder.date}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Payment Status</span>
                <span className={`font-bold uppercase ${isPaid ? "text-emerald-400" : "text-amber-400"}`}>
                  {isPaid ? "PAID (ONLINE)" : "PAY AFTER PROOF (UNPAID)"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Estimated Arrival</span>
                <span className="text-emerald-400 font-bold">
                  {confirmedOrder.shippingMethod === "express"
                    ? getEstimatedDate(2)
                    : getEstimatedDate(5)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="text-xs font-bold text-white uppercase">
                  {isPaid ? "Total Paid" : "Total Payable"}
                </span>
                <span className="font-mono font-black text-lg text-white">
                  ₹{confirmedOrder.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <a
                href={`https://wa.me/917456849955?text=${whatsappProofMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full max-w-md py-3.5 px-6 rounded-xl font-bold text-sm bg-[#25D366] text-black hover:bg-[#20bd5a] transition-colors shadow-lg"
              >
                <span>Verify Pre-Press Proof on WhatsApp</span>
                <Sparkles size={16} />
              </a>

              <Link
                href={`/orders/track?order=${encodeURIComponent(confirmedOrder.orderId)}`}
                className="inline-flex items-center justify-center gap-2 w-full max-w-md py-3.5 px-6 rounded-xl font-bold text-sm bg-brand-yellow text-black hover:bg-yellow-400 transition-colors shadow-md shadow-brand-yellow/10"
              >
                <Truck size={17} />
                <span>Track Order Live</span>
              </Link>

              <Link
                href={`/account/orders/${confirmedOrder.id}/invoice`}
                className="inline-flex items-center justify-center gap-2 w-full max-w-md py-2.5 px-6 rounded-xl font-medium text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
              >
                <FileCheck size={14} className="text-brand-yellow" />
                <span>Download / Print GST Tax Invoice</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Empty cart view
  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-bg-base text-text-primary">
        <Header />
        <main className="flex-1 max-w-[800px] w-full mx-auto px-6 py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center mx-auto text-text-muted">
            <ShoppingBag size={30} />
          </div>
          <h1 className="font-display font-black text-2xl text-white uppercase">
            Your Cart is Empty
          </h1>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Please add print items to your cart before proceeding to checkout.
          </p>
          <Link href="/shop" className="inline-block">
            <Button variant="primary" size="md">
              <span>Browse Products</span>
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 lg:px-10 py-10 md:py-14">
        {/* Amazon-style Progress Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border-subtle">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Lock size={12} className="text-brand-yellow" />
              <span>256-Bit Encrypted Secure Checkout</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
              Checkout & Delivery
            </h1>
          </div>

          {/* Stepper tracker */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                activeStep === 1 ? "text-brand-yellow" : "text-text-muted hover:text-white"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === 1 ? "bg-brand-yellow text-black" : "bg-white/10 text-white"
              }`}>1</span>
              <span>Address</span>
            </button>
            <ChevronRight size={14} className="text-border-subtle" />
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                activeStep === 2 ? "text-brand-yellow" : "text-text-muted hover:text-white"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === 2 ? "bg-brand-yellow text-black" : "bg-white/10 text-white"
              }`}>2</span>
              <span>Shipping</span>
            </button>
            <ChevronRight size={14} className="text-border-subtle" />
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                activeStep === 3 ? "text-brand-yellow" : "text-text-muted hover:text-white"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === 3 ? "bg-brand-yellow text-black" : "bg-white/10 text-white"
              }`}>3</span>
              <span>Payment</span>
            </button>
            <ChevronRight size={14} className="text-border-subtle" />
            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                activeStep === 4 ? "text-brand-yellow" : "text-text-muted hover:text-white"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === 4 ? "bg-brand-yellow text-black" : "bg-white/10 text-white"
              }`}>4</span>
              <span>Review</span>
            </button>
          </div>
        </div>

        {/* Global Error Notice */}
        {checkoutError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-200">Checkout Notice</p>
                <p>{checkoutError}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
              {paymentMethod === "online" && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("cod_proof");
                    setActiveStep(3);
                    setCheckoutError(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Select Pay After Proof</span>
                </button>
              )}
              {recoveryOrderId && (
                <Link
                  href={`/account/orders/${recoveryOrderId}/pay`}
                  className="px-4 py-2 rounded-xl bg-brand-yellow hover:bg-yellow-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-yellow/10 transition-colors"
                >
                  <span>Retry Payment Securely →</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* In-Flight Status Notice */}
        {statusMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow text-xs sm:text-sm flex items-center gap-3">
            <Loader2 size={16} className="animate-spin text-brand-yellow shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Accordion Steps */}
          <div className="lg:col-span-8 space-y-6">

            {/* ============================================================== */}
            {/* STEP 1: DELIVERY ADDRESS */}
            {/* ============================================================== */}
            <div className={`rounded-2xl border transition-all ${
              activeStep === 1
                ? "border-brand-yellow/80 bg-bg-surface shadow-lg"
                : "border-border-subtle bg-bg-surface/60"
            }`}>
              <div className="p-6 sm:p-7 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                    activeStep === 1
                      ? "bg-brand-yellow text-black"
                      : currentSelectedAddress
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/10 text-white"
                  }`}>
                    {currentSelectedAddress && activeStep > 1 ? <Check size={14} /> : 1}
                  </div>
                  <div>
                    <h2 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-tight">
                      1. Delivery Address
                    </h2>
                    {activeStep !== 1 && currentSelectedAddress && (
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                        {currentSelectedAddress.label}: {currentSelectedAddress.line1}, {currentSelectedAddress.city}, {currentSelectedAddress.state} - {currentSelectedAddress.pincode}
                      </p>
                    )}
                  </div>
                </div>

                {activeStep !== 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-xs font-bold text-brand-yellow hover:underline px-3 py-1.5 rounded-lg border border-brand-yellow/30 bg-brand-yellow/5 hover:bg-brand-yellow/10 transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Step 1 Expanded Content */}
              {activeStep === 1 && (
                <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-2 border-t border-border-subtle/70 space-y-6">
                  {addressLoading ? (
                    <div className="py-8 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-brand-yellow" />
                      <span>Loading saved addresses...</span>
                    </div>
                  ) : savedAddresses.length > 0 && !isAddingNewAddress ? (
                    /* Amazon-Style Saved Address Cards Grid */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <div
                              key={addr.id}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`rounded-xl border p-4 cursor-pointer relative transition-all ${
                                isSelected
                                  ? "border-brand-yellow bg-brand-yellow/[0.07] ring-1 ring-brand-yellow/40 shadow-sm"
                                  : "border-border-subtle bg-bg-surface-alt hover:border-white/20"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected ? "border-brand-yellow" : "border-text-muted"
                                  }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-brand-yellow" />}
                                  </div>
                                  <span className="font-bold text-sm text-white">{addr.label}</span>
                                </div>
                                {addr.isDefault && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                                    DEFAULT
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-text-secondary leading-relaxed pl-6">
                                {addr.line1}
                                {addr.line2 ? `, ${addr.line2}` : ""}
                                <br />
                                {addr.city}, {addr.state} - <strong className="text-white font-mono">{addr.pincode}</strong>
                              </p>

                              <div className="text-xs text-text-muted pl-6 pt-2 flex items-center gap-1.5">
                                <Phone size={11} />
                                <span>{addr.phone}</span>
                              </div>

                              {/* Edit / Delete actions */}
                              <div className="flex items-center gap-3 pt-3 pl-6 border-t border-border-subtle/50 mt-3 text-[11px]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditAddress(addr);
                                  }}
                                  className="text-text-secondary hover:text-brand-yellow font-medium transition-colors flex items-center gap-1"
                                >
                                  <Edit2 size={11} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteAddress(addr.id, e)}
                                  className="text-text-muted hover:text-rose-400 font-medium transition-colors flex items-center gap-1"
                                >
                                  <Trash2 size={11} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add new address trigger */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddressId(null);
                            setIsAddingNewAddress(true);
                            setAddressFormData({
                              fullName: session?.user?.name || "",
                              phone: session?.user?.phone || "",
                              pincode: "",
                              line1: "",
                              line2: "",
                              landmark: "",
                              city: "",
                              state: "Delhi NCR",
                              isDefault: false,
                              label: "Delivery Address",
                            });
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-yellow hover:underline"
                        >
                          <Plus size={14} />
                          <span>+ Add a new delivery address</span>
                        </button>

                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => setActiveStep(2)}
                          disabled={!selectedAddressId}
                          className="font-bold text-xs uppercase tracking-wider"
                        >
                          <span>Deliver to this Address →</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Add / Edit Address Form */
                    <form onSubmit={handleSaveAddress} className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                        <span className="font-bold text-xs uppercase tracking-wider text-brand-yellow">
                          {editingAddressId ? "Edit Delivery Address" : "Add a New Delivery Address"}
                        </span>
                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingNewAddress(false);
                              setEditingAddressId(null);
                            }}
                            className="text-xs text-text-muted hover:text-white"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-semibold text-text-secondary uppercase">
                            Full Name / Recipient *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Sharma"
                            value={addressFormData.fullName}
                            onChange={(e) => setAddressFormData((p) => ({ ...p, fullName: e.target.value }))}
                            className="w-full rounded-xl bg-bg-surface-alt border border-border-subtle px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-yellow"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary uppercase">
                            Mobile Number (for Courier Tracking) *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 98765 43210"
                            value={addressFormData.phone}
                            onChange={(e) => setAddressFormData((p) => ({ ...p, phone: e.target.value }))}
                            className="w-full rounded-xl bg-bg-surface-alt border border-border-subtle px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-yellow"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary uppercase">
                            6-Digit Indian PIN Code *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="e.g. 110001"
                            value={addressFormData.pincode}
                            onChange={(e) => {
                              const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
                              setAddressFormData((p) => ({ ...p, pincode: pin }));
                            }}
                            className="w-full rounded-xl bg-bg-surface-alt border border-border-subtle px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-yellow font-mono"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-semibold text-text-secondary uppercase">
                            Flat, House No., Building, Company, Premise *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Unit 402, Apex Business Park"
                            value={addressFormData.line1}
                            onChange={(e) => setAddressFormData((p) => ({ ...p, line1: e.target.value }))}
                            className="w-full rounded-xl bg-bg-surface-alt border border-border-subtle px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-yellow"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-semibold text-text-secondary uppercase">
                            Area, Street, Sector, Village *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. MG Road, Near Central Metro Station"
                            value={addressFormData.line2}
                            onChange={(e) => setAddressFormData((p) => ({ ...p, line2: e.target.value }))}
                            className="w-full rounded-xl bg-bg-surface-alt border border-border-subtle px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-yellow"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary uppercase">
                            City / Town *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. New Delhi, Mumbai"
                            value={addressFormData.city}
                            onChange={(e) => setAddressFormData((p) => ({ ...p, city: e.target.value }))}
                            className="w-full rounded-xl bg-bg-surface-alt border border-border-subtle px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-yellow"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary uppercase">
                            State *
                          </label>
                          <select
                            value={addressFormData.state}
                            onChange={(e) => setAddressFormData((p) => ({ ...p, state: e.target.value }))}
                            className="w-full rounded-xl bg-bg-surface-alt border border-border-subtle px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-yellow"
                          >
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st} className="bg-bg-surface text-white">
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {addressError && (
                        <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
                          <AlertCircle size={14} />
                          <span>{addressError}</span>
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary">
                          <input
                            type="checkbox"
                            checked={addressFormData.isDefault}
                            onChange={(e) => setAddressFormData((p) => ({ ...p, isDefault: e.target.checked }))}
                            className="rounded bg-bg-surface-alt text-brand-yellow focus:ring-brand-yellow"
                          />
                          <span>Set as my default delivery address</span>
                        </label>

                        <div className="flex items-center gap-3">
                          {savedAddresses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setIsAddingNewAddress(false)}
                              className="px-4 py-2 rounded-xl text-xs text-text-secondary hover:text-white"
                            >
                              Cancel
                            </button>
                          )}
                          <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            className="font-bold text-xs"
                          >
                            <span>Save & Deliver to this Address</span>
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* STEP 2: SHIPPING METHOD & SPEED */}
            {/* ============================================================== */}
            <div className={`rounded-2xl border transition-all ${
              activeStep === 2
                ? "border-brand-yellow/80 bg-bg-surface shadow-lg"
                : "border-border-subtle bg-bg-surface/60"
            }`}>
              <div className="p-6 sm:p-7 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                    activeStep === 2
                      ? "bg-brand-yellow text-black"
                      : activeStep > 2
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/10 text-white"
                  }`}>
                    {activeStep > 2 ? <Check size={14} /> : 2}
                  </div>
                  <div>
                    <h2 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-tight">
                      2. Shipping & Production Speed
                    </h2>
                    {activeStep !== 2 && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {shippingMethod === "express"
                          ? `Priority 24h Rush (+₹249) • Est. Delivery: ${getEstimatedDate(2)}`
                          : `Standard Pan-India Delivery (${subtotal >= 999 ? "FREE" : "₹99"}) • Est. Delivery: ${getEstimatedDate(5)}`}
                      </p>
                    )}
                  </div>
                </div>

                {activeStep > 2 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="text-xs font-bold text-brand-yellow hover:underline px-3 py-1.5 rounded-lg border border-brand-yellow/30 bg-brand-yellow/5 hover:bg-brand-yellow/10 transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Step 2 Expanded Content */}
              {activeStep === 2 && (
                <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-2 border-t border-border-subtle/70 space-y-4">
                  {/* Serviceability note based on selected PIN code */}
                  {currentSelectedAddress?.pincode && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                        <span>
                          PIN Code <strong>{currentSelectedAddress.pincode}</strong> is serviceable for insured delivery.
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-emerald-400">
                        Insured Transit
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Standard Delivery */}
                    <div
                      onClick={() => setShippingMethod("standard")}
                      className={`rounded-xl border p-4 cursor-pointer flex flex-col justify-between transition-all ${
                        shippingMethod === "standard"
                          ? "border-brand-yellow bg-brand-yellow/[0.07] ring-1 ring-brand-yellow/40 shadow-sm"
                          : "border-border-subtle bg-bg-surface-alt hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>Standard Production & Delivery</span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            Dispatched in 3–5 business days. Moisture-proof boxed courier parcel.
                          </p>
                          <div className="text-xs text-emerald-400 font-semibold pt-1 flex items-center gap-1">
                            <Clock size={12} />
                            <span>Estimated Arrival: {getEstimatedDate(5)}</span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          shippingMethod === "standard" ? "border-brand-yellow" : "border-text-muted"
                        }`}>
                          {shippingMethod === "standard" && <div className="w-2 h-2 rounded-full bg-brand-yellow" />}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border-subtle/50 flex items-center justify-between text-xs">
                        <span className="text-text-muted">Courier Charges:</span>
                        <span className="font-mono font-bold text-brand-yellow">
                          {subtotal >= 999 ? "FREE" : "₹99"}
                        </span>
                      </div>
                    </div>

                    {/* Express Priority Rush */}
                    <div
                      onClick={() => setShippingMethod("express")}
                      className={`rounded-xl border p-4 cursor-pointer flex flex-col justify-between transition-all ${
                        shippingMethod === "express"
                          ? "border-brand-yellow bg-brand-yellow/[0.07] ring-1 ring-brand-yellow/40 shadow-sm"
                          : "border-border-subtle bg-bg-surface-alt hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>Priority 24h Rush Press</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                              FAST
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed">
                            Jumps directly to the front of the offset queue. Dispatched in 24–48 hours.
                          </p>
                          <div className="text-xs text-emerald-400 font-semibold pt-1 flex items-center gap-1">
                            <Clock size={12} />
                            <span>Estimated Arrival: {getEstimatedDate(2)}</span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          shippingMethod === "express" ? "border-brand-yellow" : "border-text-muted"
                        }`}>
                          {shippingMethod === "express" && <div className="w-2 h-2 rounded-full bg-brand-yellow" />}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border-subtle/50 flex items-center justify-between text-xs">
                        <span className="text-text-muted">Rush Priority Fee:</span>
                        <span className="font-mono font-bold text-white">
                          +₹249
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setActiveStep(3)}
                      className="font-bold text-xs uppercase tracking-wider"
                    >
                      <span>Continue to Payment Method →</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* STEP 3: PAYMENT METHOD & INVOICING */}
            {/* ============================================================== */}
            <div className={`rounded-2xl border transition-all ${
              activeStep === 3
                ? "border-brand-yellow/80 bg-bg-surface shadow-lg"
                : "border-border-subtle bg-bg-surface/60"
            }`}>
              <div className="p-6 sm:p-7 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                    activeStep === 3
                      ? "bg-brand-yellow text-black"
                      : activeStep > 3
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/10 text-white"
                  }`}>
                    {activeStep > 3 ? <Check size={14} /> : 3}
                  </div>
                  <div>
                    <h2 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-tight">
                      3. Payment Method & Invoicing
                    </h2>
                    {activeStep !== 3 && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {paymentMethod === "online"
                          ? "Online Razorpay (UPI, Credit/Debit Cards, NetBanking)"
                          : "Pay After Pre-Press Proof Approval (COD / Bank Transfer)"}
                      </p>
                    )}
                  </div>
                </div>

                {activeStep > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="text-xs font-bold text-brand-yellow hover:underline px-3 py-1.5 rounded-lg border border-brand-yellow/30 bg-brand-yellow/5 hover:bg-brand-yellow/10 transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Step 3 Expanded Content */}
              {activeStep === 3 && (
                <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-2 border-t border-border-subtle/70 space-y-5">
                  <div className="space-y-3">
                    {/* Online Payment */}
                    <div
                      onClick={() => setPaymentMethod("online")}
                      className={`rounded-xl border p-4 cursor-pointer flex items-center justify-between transition-all ${
                        paymentMethod === "online"
                          ? "border-brand-yellow bg-brand-yellow/[0.07] ring-1 ring-brand-yellow/40 shadow-sm"
                          : "border-border-subtle bg-bg-surface-alt hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center text-brand-yellow shrink-0">
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            Online Payment (Instant Confirmation via Razorpay)
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Google Pay, PhonePe, Paytm, UPI QR, RuPay, Visa, Mastercard, NetBanking.
                          </p>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        paymentMethod === "online" ? "border-brand-yellow" : "border-text-muted"
                      }`}>
                        {paymentMethod === "online" && <div className="w-2 h-2 rounded-full bg-brand-yellow" />}
                      </div>
                    </div>

                    {/* Pay After Proof */}
                    <div
                      onClick={() => setPaymentMethod("cod_proof")}
                      className={`rounded-xl border p-4 cursor-pointer flex items-center justify-between transition-all ${
                        paymentMethod === "cod_proof"
                          ? "border-brand-yellow bg-brand-yellow/[0.07] ring-1 ring-brand-yellow/40 shadow-sm"
                          : "border-border-subtle bg-bg-surface-alt hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-yellow shrink-0">
                          <FileCheck size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            Pay After Pre-Press Proof Approval (COD / Bank Transfer)
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            Inspect digital PDF proof on WhatsApp before printing, then pay before dispatch.
                          </p>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        paymentMethod === "cod_proof" ? "border-brand-yellow" : "border-text-muted"
                      }`}>
                        {paymentMethod === "cod_proof" && <div className="w-2 h-2 rounded-full bg-brand-yellow" />}
                      </div>
                    </div>
                  </div>

                  {/* B2B GST Invoicing Box */}
                  <div className="p-4 rounded-xl border border-border-subtle bg-bg-surface-alt space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGstRequired}
                        onChange={(e) => setIsGstRequired(e.target.checked)}
                        className="rounded bg-bg-surface text-brand-yellow focus:ring-brand-yellow"
                      />
                      <span className="font-semibold text-xs text-white">
                        I need a B2B GST Tax Invoice for Input Tax Credit (18% ITC)
                      </span>
                    </label>

                    {isGstRequired && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary uppercase">
                            Registered Company Name *
                          </label>
                          <input
                            type="text"
                            required={isGstRequired}
                            placeholder="e.g. Apex Corporation Pvt Ltd"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full rounded-lg bg-bg-surface border border-border-subtle px-3 py-2 text-white text-xs focus:outline-none focus:border-brand-yellow"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-text-secondary uppercase">
                            15-Digit GSTIN *
                          </label>
                          <input
                            type="text"
                            maxLength={15}
                            required={isGstRequired}
                            placeholder="07AAAAA0000A1Z5"
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value.toUpperCase().trim())}
                            className="w-full rounded-lg bg-bg-surface border border-border-subtle px-3 py-2 text-white font-mono uppercase text-xs focus:outline-none focus:border-brand-yellow"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setActiveStep(4)}
                      className="font-bold text-xs uppercase tracking-wider"
                    >
                      <span>Review Items & Place Order →</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* STEP 4: ITEMS & FINAL ORDER REVIEW */}
            {/* ============================================================== */}
            <div className={`rounded-2xl border transition-all ${
              activeStep === 4
                ? "border-brand-yellow/80 bg-bg-surface shadow-lg"
                : "border-border-subtle bg-bg-surface/60"
            }`}>
              <div className="p-6 sm:p-7 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                    activeStep === 4 ? "bg-brand-yellow text-black" : "bg-white/10 text-white"
                  }`}>
                    4
                  </div>
                  <div>
                    <h2 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-tight">
                      4. Review Order Items & Customizations
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Verify specifications and personalized details before printing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 Expanded Review */}
              {activeStep === 4 && (
                <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-2 border-t border-border-subtle/70 space-y-6">
                  {/* Detailed Item List */}
                  <div className="divide-y divide-border-subtle/60 rounded-xl border border-border-subtle bg-bg-surface-alt overflow-hidden">
                    {items.map((it) => (
                      <div key={it.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-bg-surface border border-border-subtle shrink-0">
                            <Image
                              src={it.imageSrc}
                              alt={it.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="font-bold text-sm text-white truncate">{it.name}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                              {it.sizeLabel && (
                                <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white">
                                  Size: {it.sizeLabel}
                                </span>
                              )}
                              {it.materialLabel && (
                                <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white">
                                  Paper: {it.materialLabel}
                                </span>
                              )}
                              <span className="font-mono text-brand-yellow">
                                Qty: {it.quantity.toLocaleString()}
                              </span>
                            </div>

                            {(it.customText || it.customizations?.personalizedText) && (
                              <p className="text-[11px] text-amber-300 italic">
                                &ldquo;{it.customText || it.customizations?.personalizedText}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right sm:self-center shrink-0">
                          <div className="font-mono font-bold text-base text-brand-yellow">
                            ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                          </div>
                          <span className="text-[10px] text-text-muted">
                            (₹{it.price} / unit)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Notes input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-secondary uppercase">
                      Additional Delivery Instructions or Gate Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Leave package with reception, ring doorbell twice"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full bg-bg-surface-alt border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-brand-yellow"
                    />
                  </div>

                  {/* Summary verification pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-white/[0.02] border border-border-subtle text-xs">
                    <div>
                      <span className="text-text-muted block text-[11px]">Shipping to:</span>
                      <strong className="text-white">
                        {currentSelectedAddress ? `${currentSelectedAddress.line1}, ${currentSelectedAddress.city} - ${currentSelectedAddress.pincode}` : "Entered Address"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[11px]">Payment Mode:</span>
                      <strong className="text-brand-yellow">
                        {paymentMethod === "online" ? "Online Razorpay (UPI/Cards)" : "Pay After Proof"}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Summary & Final CTA */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 sm:p-7 space-y-6 shadow-xl sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">
                  Order Summary
                </h3>
                <Link
                  href="/cart"
                  className="text-xs text-brand-yellow hover:underline"
                >
                  Edit Cart
                </Link>
              </div>

              {/* Coupon Form in Summary */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-text-secondary uppercase">
                  Have a Promo Code?
                </label>
                {couponCode && serverQuote?.couponApplied ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                    <span className="font-mono font-bold">
                      {couponCode} (-₹{serverQuote.couponApplied.discountAmount})
                    </span>
                    <button
                      type="button"
                      onClick={removeCouponCode}
                      className="text-text-muted hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={applyCouponCode} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. STAR10"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 h-9 px-3 rounded-xl bg-bg-surface-alt border border-border-subtle text-xs text-white uppercase font-mono placeholder:text-text-muted focus:outline-none focus:border-brand-yellow"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={!couponInput.trim()}
                      className="h-9 px-3 text-xs"
                    >
                      Apply
                    </Button>
                  </form>
                )}

                {couponFeedback && (
                  <p className={`text-[11px] flex items-center gap-1 ${
                    couponFeedback.type === "success" ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {couponFeedback.type === "success" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    <span>{couponFeedback.msg}</span>
                  </p>
                )}
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-border-subtle text-xs">
                <div className="flex items-center justify-between text-text-secondary">
                  <span>Items Subtotal</span>
                  <span className="font-mono text-white font-medium">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400 font-medium">
                    <span>Coupon Discount</span>
                    <span className="font-mono">−₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-text-secondary">
                  <span>Pan-India Shipping</span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-400 font-bold uppercase">
                      FREE
                    </span>
                  ) : (
                    <span className="font-mono text-white">₹{shippingFee}</span>
                  )}
                </div>

                {shippingMethod === "express" && (
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Priority 24h Rush</span>
                    <span className="font-mono text-white font-medium">+₹249</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-text-secondary">
                  <span>Estimated GST (18%)</span>
                  <span className="font-mono text-white">
                    ₹{gstAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="pt-3 border-t border-border-subtle flex items-baseline justify-between">
                  <div>
                    <div className="font-display font-black text-base text-white uppercase">
                      Total Payable
                    </div>
                    <span className="text-[10px] text-text-muted">
                      All inclusive (Taxes & Shipping)
                    </span>
                  </div>
                  <div className="font-mono font-black text-2xl text-brand-yellow">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Submit / Place Order Button */}
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
                className="w-full justify-center text-sm uppercase tracking-wider font-black py-4 disabled:opacity-50 shadow-xl shadow-brand-yellow/15"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin text-black" size={16} />
                    <span>{statusMessage || "Processing Order..."}</span>
                  </span>
                ) : paymentMethod === "online" ? (
                  <span>Place Order & Pay ₹{grandTotal.toLocaleString("en-IN")} →</span>
                ) : (
                  <span>Place Order (Pay After Proof) →</span>
                )}
              </Button>

              {/* Micro Guarantees */}
              <div className="pt-2 text-[11px] text-text-muted space-y-1.5 border-t border-border-subtle">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Free Pre-Flight Artwork & Bleed Inspection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={13} className="text-emerald-400" />
                  <span>Live Courier Tracking Link Dispatched via SMS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock size={13} className="text-emerald-400" />
                  <span>Authorized Razorpay Level-1 PCI Compliant Gateway</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
