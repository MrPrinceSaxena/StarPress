"use client";

import React, { useState, Suspense, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { evaluatePassword, PASSWORD_MIN_LENGTH } from "@/lib/validation/auth";

// ---------------------------------------------------------------------------
// Inline field error — no layout shift (min-h reserves space)
// ---------------------------------------------------------------------------
function FieldError({ id, message }: { id?: string; message: string | null }) {
  return (
    <div id={id} role={message ? "alert" : undefined} aria-live="polite" className="min-h-[18px] mt-1">
      {message && (
        <p className="flex items-center gap-1 text-[11px] text-rose-400 font-medium leading-tight">
          <AlertCircle size={11} className="shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Register Form (inner — uses useSearchParams, must be inside <Suspense>)
// ---------------------------------------------------------------------------
function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  // Unique IDs for label association
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({
    name: null,
    email: null,
    phone: null,
    password: null,
    confirmPassword: null,
  });

  // General / server error (shown below CTA)
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordEvaluation = evaluatePassword(formData.password);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error as user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Full name is required.";
        if (value.trim().length < 2) return "Name must be at least 2 characters.";
        return null;
      case "email":
        if (!value.trim()) return "Email address is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return "Please enter a valid email address.";
        return null;
      case "phone":
        if (!value.trim()) return "Mobile number is required.";
        if (!/^[6-9]\d{9}$/.test(value.trim()))
          return "Enter a valid 10-digit Indian mobile number.";
        return null;
      case "password":
        if (!value) return "Password is required.";
        if (!evaluatePassword(value).isValid)
          return (
            evaluatePassword(value).errors[0] ||
            `Password must be at least ${PASSWORD_MIN_LENGTH} characters with uppercase, lowercase, number & special character.`
          );
        return null;
      case "confirmPassword":
        if (!value) return "Please confirm your password.";
        if (value !== formData.password) return "Passwords do not match.";
        return null;
      default:
        return null;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: Record<string, string | null> = {};
    (Object.keys(formData) as Array<keyof typeof formData>).forEach((key) => {
      errors[key] = validateField(key, formData[key]);
    });
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setServerError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || "Failed to create account. Please try again.");
        setIsLoading(false);
        return;
      }

      router.push(
        `/login?registered=true${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`
      );
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  // ── Strength meter colors ─────────────────────────────────────────────────
  const strengthColors: Record<string, string> = {
    strong: "bg-emerald-500",
    good: "bg-amber-400",
    fair: "bg-yellow-500",
    weak: "bg-rose-500",
  };
  const strengthTextColors: Record<string, string> = {
    strong: "text-emerald-400",
    good: "text-amber-400",
    fair: "text-yellow-500",
    weak: "text-rose-400",
  };

  // ── Shared input className factory ────────────────────────────────────────
  const inputCls = (hasError: boolean) =>
    `w-full bg-white/[0.04] border rounded-full px-5 py-3.5 text-sm text-white
     placeholder-slate-500 transition-all duration-200
     focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow
     focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:border-brand-yellow
     hover:border-white/20
     ${hasError ? "border-rose-500/60 bg-rose-500/[0.04]" : "border-white/[0.10]"}`;

  return (
    <div className="flex flex-col justify-center w-full max-w-[480px] px-8 sm:px-12 py-10">
      {/* Back arrow */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium mb-8 w-fit
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2
          focus-visible:ring-offset-[#0B0C10] rounded-md transition-colors"
        aria-label="Back to homepage"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back</span>
      </Link>

      {/* Heading */}
      <div className="mb-7">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-1">
          Create <span className="text-brand-yellow">Account</span>
        </h1>
        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="text-brand-yellow font-semibold hover:underline
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow rounded-sm"
          >
            Sign In
          </Link>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-1">
        {/* Full Name */}
        <div>
          <label htmlFor={nameId} className="block text-xs font-semibold text-slate-300 tracking-wide mb-1.5">
            Full Name
          </label>
          <input
            id={nameId}
            type="text"
            name="name"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Rohan Sharma"
            aria-describedby={fieldErrors.name ? `${nameId}-error` : undefined}
            aria-invalid={!!fieldErrors.name}
            className={inputCls(!!fieldErrors.name)}
          />
          <FieldError id={`${nameId}-error`} message={fieldErrors.name} />
        </div>

        {/* Email */}
        <div>
          <label htmlFor={emailId} className="block text-xs font-semibold text-slate-300 tracking-wide mb-1.5">
            Email Address
          </label>
          <input
            id={emailId}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="rohan@company.in"
            aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
            aria-invalid={!!fieldErrors.email}
            className={inputCls(!!fieldErrors.email)}
          />
          <FieldError id={`${emailId}-error`} message={fieldErrors.email} />
        </div>

        {/* Mobile */}
        <div>
          <label htmlFor={phoneId} className="block text-xs font-semibold text-slate-300 tracking-wide mb-1.5">
            Mobile Number{" "}
            <span className="text-slate-500 font-normal">(WhatsApp proofs &amp; AWB alerts)</span>
          </label>
          <input
            id={phoneId}
            type="tel"
            name="phone"
            autoComplete="tel"
            required
            value={formData.phone}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="9876543210"
            aria-describedby={fieldErrors.phone ? `${phoneId}-error` : undefined}
            aria-invalid={!!fieldErrors.phone}
            className={inputCls(!!fieldErrors.phone)}
          />
          <FieldError id={`${phoneId}-error`} message={fieldErrors.phone} />
        </div>

        {/* Password */}
        <div>
          <label htmlFor={passwordId} className="block text-xs font-semibold text-slate-300 tracking-wide mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Minimum 12 characters"
              aria-describedby={fieldErrors.password ? `${passwordId}-error` : `${passwordId}-hint`}
              aria-invalid={!!fieldErrors.password}
              className={`${inputCls(!!fieldErrors.password)} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow rounded-full"
            >
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>

          {/* Password strength meter (shown once user starts typing) */}
          {formData.password && (
            <div id={`${passwordId}-hint`} className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Strength:</span>
                <span className={`font-semibold capitalize ${strengthTextColors[passwordEvaluation.strength] ?? "text-slate-400"}`}>
                  {passwordEvaluation.strength}
                </span>
              </div>
              {/* 4-segment bar */}
              <div className="grid grid-cols-4 gap-1.5 h-1.5" aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`rounded-full transition-all duration-300 ${
                      passwordEvaluation.score >= step
                        ? (strengthColors[passwordEvaluation.strength] ?? "bg-slate-500")
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              {/* Checklist */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-0.5 text-[11px] text-slate-500">
                {[
                  { label: `${PASSWORD_MIN_LENGTH}+ characters`, met: formData.password.length >= PASSWORD_MIN_LENGTH },
                  { label: "Upper & lower case", met: /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) },
                  { label: "At least 1 number", met: /[0-9]/.test(formData.password) },
                  { label: "Special character", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(formData.password) },
                ].map(({ label, met }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] shrink-0 ${
                        met
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-white/5 text-slate-600 border border-white/10"
                      }`}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span className={met ? "text-slate-400" : ""}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <FieldError id={`${passwordId}-error`} message={fieldErrors.password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor={confirmPasswordId} className="block text-xs font-semibold text-slate-300 tracking-wide mb-1.5">
            Confirm Password
          </label>
          <input
            id={confirmPasswordId}
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Re-enter password"
            aria-describedby={fieldErrors.confirmPassword ? `${confirmPasswordId}-error` : undefined}
            aria-invalid={!!fieldErrors.confirmPassword}
            className={inputCls(!!fieldErrors.confirmPassword)}
          />
          <FieldError id={`${confirmPasswordId}-error`} message={fieldErrors.confirmPassword} />
        </div>

        {/* Server error — below CTA */}
        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-rose-500/30
              bg-rose-500/10 text-rose-300 text-xs mt-2"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-400" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Perks checklist */}
        <div className="pt-2 space-y-1.5 text-[11px] text-slate-500">
          {[
            "Free digital 3D soft proof review on all orders",
            "Saved multiple delivery destinations (Offices, Warehouses)",
          ].map((perk) => (
            <div key={perk} className="flex items-center gap-2">
              <CheckCircle size={12} className="text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{perk}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full !mt-5 relative group overflow-hidden rounded-full py-3.5 px-6
            font-display font-extrabold text-sm uppercase tracking-wider text-black
            bg-brand-yellow hover:bg-[#FFE04D]
            shadow-[0_4px_24px_rgba(245,186,19,0.30)] hover:shadow-[0_6px_32px_rgba(245,186,19,0.45)]
            active:translate-y-0.5 active:scale-[0.99] transition-all duration-200
            flex items-center justify-center gap-2 cursor-pointer
            disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow
            focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C10]"
          aria-busy={isLoading}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent
              -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
          />
          {isLoading ? (
            <span className="flex items-center gap-2 relative z-10">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              <span>Creating Account…</span>
            </span>
          ) : (
            <span className="relative z-10">Create Star Press Account</span>
          )}
        </button>
      </form>

      {/* Security badge */}
      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
        <ShieldCheck size={14} className="text-emerald-400 shrink-0" aria-hidden="true" />
        <span>Your data and uploaded artworks are strictly confidential</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell — split screen (mirrors login layout exactly)
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex bg-[#0B0C10] text-white selection:bg-brand-yellow selection:text-black">

      {/* ── LEFT PANEL: Brand Image ── */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col overflow-hidden"
        aria-hidden="true"
      >
        {/* Background image via next/image */}
        <Image
          src="/images/auth-press-bg.jpg"
          alt=""
          fill
          priority
          sizes="42vw"
          className="object-cover object-center"
          quality={90}
        />

        {/* Dark gradient overlays (CSS, not baked into image) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10]/70 via-[#0B0C10]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/10 to-[#0B0C10]/60" />

        {/* Neon glow accents — CSS only */}
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-0 w-56 h-56 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 p-8 xl:p-10">
          <div className="relative h-11 w-36">
            <Image
              src="/images/Logo.png"
              alt="Star Press — The Printing Hub"
              fill
              sizes="144px"
              priority
              className="object-contain drop-shadow-[0_0_18px_rgba(245,186,19,0.40)]"
            />
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 mt-auto p-8 xl:p-10">
          <p className="text-xs uppercase tracking-widest font-bold text-brand-yellow/80 font-mono mb-2">
            Join Star Press
          </p>
          <h2 className="font-display font-extrabold text-2xl xl:text-3xl text-white leading-snug tracking-tight">
            Ideas to <br />Printed Realities.
          </h2>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Corporate accounts · B2B pricing · WhatsApp proofs.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Form ── */}
      <div className="flex-1 flex items-center justify-center relative overflow-y-auto">
        {/* Right panel background treatment */}
        <div className="absolute inset-0 bg-[#0B0C10]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-cyan/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-[480px]">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
                <Loader2 size={28} className="animate-spin text-brand-yellow" />
                <p className="text-xs tracking-wider uppercase">Loading…</p>
              </div>
            }
          >
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
