"use client";

import React, { useState, useCallback, useRef, Suspense, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Inline field error component — no layout shift, reserved space via min-h
// ---------------------------------------------------------------------------
function FieldError({ message }: { message: string | null }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="min-h-[18px] mt-1"
    >
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
// Login Form (inner — uses useSearchParams, must be inside <Suspense>)
// ---------------------------------------------------------------------------
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const registered = searchParams.get("registered");
  const errorParam = searchParams.get("error");

  // Unique IDs for accessible label association
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Field-level errors (shown on blur or submit)
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // General / server error (shown below CTA)
  const [serverError, setServerError] = useState<string | null>(
    errorParam === "AccessDenied"
      ? "You do not have administrator permissions to access that area."
      : null
  );

  const [isLoading, setIsLoading] = useState(false);

  // ── Validation helpers ────────────────────────────────────────────────────
  const validateEmail = (value: string): string | null => {
    if (!value.trim()) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
      return "Please enter a valid email address.";
    return null;
  };

  const validatePassword = (value: string): string | null => {
    if (!value) return "Password is required.";
    return null;
  };

  // ── Blur handlers (fire field validation on blur) ──────────────────────
  const handleEmailBlur = () => setEmailError(validateEmail(email));
  const handlePasswordBlur = () => setPasswordError(validatePassword(password));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submit
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setServerError(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setServerError(res.error);
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setServerError("Unable to connect to authentication server. Please try again.");
      setIsLoading(false);
    }
  };

  // ── Demo quick-fill ───────────────────────────────────────────────────────
  const fillDemoAdmin = () => {
    setEmail("admin@starpress.in");
    setPassword("Admin@StarPress2026");
    setEmailError(null);
    setPasswordError(null);
    setServerError(null);
  };

  const fillDemoCustomer = () => {
    setEmail("customer@starpress.in");
    setPassword("Customer@StarPress2026");
    setEmailError(null);
    setPasswordError(null);
    setServerError(null);
  };

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
          Welcome{" "}
          <span className="text-brand-yellow">Back</span>
        </h1>
        <p className="text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="text-brand-yellow font-semibold hover:underline
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow rounded-sm"
          >
            Create an Account
          </Link>
        </p>
      </div>

      {/* Registration success banner */}
      {registered && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs"
        >
          <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-400" aria-hidden="true" />
          <span>Account created successfully! Please sign in with your credentials.</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-1">
        {/* Email */}
        <div>
          <label
            htmlFor={emailId}
            className="block text-xs font-semibold text-slate-300 tracking-wide mb-1.5"
          >
            Email Address
          </label>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
            onBlur={handleEmailBlur}
            placeholder="name@company.com"
            aria-describedby={emailError ? `${emailId}-error` : undefined}
            aria-invalid={!!emailError}
            className={`w-full bg-white/[0.04] border rounded-full px-5 py-3.5 text-sm text-white
              placeholder-slate-500 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow
              focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:border-brand-yellow
              hover:border-white/20
              ${emailError ? "border-rose-500/60 bg-rose-500/[0.04]" : "border-white/[0.10]"}`}
          />
          <div id={`${emailId}-error`}>
            <FieldError message={emailError} />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={passwordId}
              className="block text-xs font-semibold text-slate-300 tracking-wide"
            >
              Password
            </label>
            <Link
              href="/contact?topic=PasswordReset"
              className="text-xs font-medium text-brand-yellow/90 hover:text-brand-yellow hover:underline transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow rounded-sm"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(null); }}
              onBlur={handlePasswordBlur}
              placeholder="••••••••••••"
              aria-describedby={passwordError ? `${passwordId}-error` : undefined}
              aria-invalid={!!passwordError}
              className={`w-full bg-white/[0.04] border rounded-full px-5 pr-12 py-3.5 text-sm text-white
                placeholder-slate-500 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow
                focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:border-brand-yellow
                hover:border-white/20
                ${passwordError ? "border-rose-500/60 bg-rose-500/[0.04]" : "border-white/[0.10]"}`}
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
          <div id={`${passwordId}-error`}>
            <FieldError message={passwordError} />
          </div>
        </div>

        {/* Server / general error — below CTA */}
        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-rose-500/30
              bg-rose-500/10 text-rose-300 text-xs mt-1"
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-400" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

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
          {/* Shimmer on hover */}
          <span
            aria-hidden="true"
            className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent
              -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
          />
          {isLoading ? (
            <span className="flex items-center gap-2 relative z-10">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              <span>Signing In…</span>
            </span>
          ) : (
            <span className="relative z-10">Sign In to Star Press</span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6 flex items-center" aria-hidden="true">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      {/* Developer / Admin Quick Access */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center space-y-2.5">
        <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
          <Sparkles size={13} className="text-brand-yellow fill-brand-yellow/30" aria-hidden="true" />
          <span>Developer / Admin Quick Access</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="flex-1 py-2 px-3 rounded-xl bg-brand-yellow/10 hover:bg-brand-yellow/20
              border border-brand-yellow/30 hover:border-brand-yellow/50
              text-xs text-slate-200 hover:text-white transition-all duration-200
              flex items-center justify-center gap-1.5 font-medium
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow rounded-xl"
          >
            <span>Admin</span>
            <span className="text-brand-yellow font-mono text-[10px]">(admin@starpress.in)</span>
          </button>
          <button
            type="button"
            onClick={fillDemoCustomer}
            className="flex-1 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08]
              border border-white/[0.08] hover:border-white/20
              text-xs text-slate-400 hover:text-slate-200 transition-all duration-200 font-medium
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
            title="Fill Customer Test Account"
          >
            Customer Test
          </button>
        </div>
      </div>

      {/* Security badge */}
      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
        <ShieldCheck size={14} className="text-emerald-400 shrink-0" aria-hidden="true" />
        <span>256-bit encrypted session</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page shell — split screen
// ---------------------------------------------------------------------------
export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#0B0C10] text-white selection:bg-brand-yellow selection:text-black">

      {/* ── LEFT PANEL: Brand Image ── */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col overflow-hidden"
        aria-hidden="true"
      >
        {/* Background image */}
        <Image
          src="/images/auth-press-bg.jpg"
          alt=""
          fill
          priority
          sizes="42vw"
          className="object-cover object-center"
          quality={90}
        />

        {/* Dark gradient overlays for legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C10]/70 via-[#0B0C10]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/10 to-[#0B0C10]/60" />

        {/* Neon cyan glow rim (CSS only, not baked into image) */}
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-0 w-56 h-56 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top-left: Logo */}
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
            Enterprise Portal
          </p>
          <h2 className="font-display font-extrabold text-2xl xl:text-3xl text-white leading-snug tracking-tight">
            Your Printing <br />Workspace Awaits.
          </h2>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Track jobs · Manage orders · Print without limits.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Form ── */}
      <div className="flex-1 flex items-center justify-center relative overflow-y-auto">
        {/* Subtle background texture for right panel */}
        <div className="absolute inset-0 bg-[#0B0C10]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-cyan/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-[480px]">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
                <Loader2 size={28} className="animate-spin text-brand-yellow" />
                <p className="text-xs tracking-wider uppercase">Loading workspace…</p>
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
