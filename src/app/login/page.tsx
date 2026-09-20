"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense, useId } from "react";
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

import { supabase } from "@/lib/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";

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
// Authenticated Redirect Screen
// ---------------------------------------------------------------------------
function AuthenticatedRedirectScreen({ session }: { session: any }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-16">
      <div className="w-16 h-16 rounded-full bg-brand-yellow/10 border border-brand-yellow/30 flex items-center justify-center text-brand-yellow mb-6">
        <Loader2 size={32} className="animate-spin" />
      </div>
      <h2 className="font-display font-bold text-2xl text-white mb-2">
        Already Signed In
      </h2>
      <p className="text-sm text-slate-300 mb-1">
        Welcome back, <span className="font-semibold text-brand-yellow">{session?.user?.name || session?.user?.email}</span>
      </p>
      <p className="text-xs text-slate-500">
        Redirecting to your account dashboard…
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login Form Skeleton
// ---------------------------------------------------------------------------
function LoginSkeleton() {
  return (
    <div className="flex flex-col justify-center w-full max-w-[480px] px-8 sm:px-12 py-10 animate-pulse">
      <div className="w-16 h-4 bg-white/10 rounded mb-8" />
      <div className="w-48 h-8 bg-white/10 rounded mb-2" />
      <div className="w-64 h-4 bg-white/5 rounded mb-8" />
      <div className="space-y-4">
        <div className="w-full h-12 bg-white/5 rounded-full" />
        <div className="w-full h-12 bg-white/5 rounded-full" />
        <div className="w-full h-12 bg-brand-yellow/20 rounded-full mt-6" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login Form (inner — uses useSearchParams, must be inside <Suspense>)
// ---------------------------------------------------------------------------
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, status, isHydrated, signInWithGoogle, isConfigured } = useAuthSession();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const registered = searchParams.get("registered");
  const errorParam = searchParams.get("error");

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      const redirectUrl = session.user?.role === "ADMIN" ? "/admin/orders" : callbackUrl;
      router.replace(redirectUrl);
    }
  }, [status, session, router, callbackUrl]);

  // Unique IDs for accessible label association
  const emailId = useId();
  const passwordId = useId();

  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
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
      : errorParam === "OAuthCallbackError"
      ? "Unable to complete Google verification. Please try again."
      : null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  // ── Blur handlers ─────────────────────────────────────────────────────────
  const handleEmailBlur = () => setEmailError(validateEmail(email));
  const handlePasswordBlur = () => setPasswordError(validatePassword(password));

  // ── Submit via Supabase Auth ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setServerError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setServerError(error.message || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        const isAdmin = data.user.app_metadata?.role === "ADMIN";
        const dest = isAdmin ? "/admin/orders" : callbackUrl;
        router.push(dest);
        router.refresh();
      }
    } catch {
      setServerError("Unable to connect to authentication service. Please try again.");
      setIsLoading(false);
    }
  };

  // ── Google OAuth Submit ───────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setServerError(null);
    const { error } = await signInWithGoogle(callbackUrl);
    if (error) {
      setServerError(error.message);
      setIsGoogleLoading(false);
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

  if (!isHydrated) {
    return <LoginSkeleton />;
  }

  if (status === "authenticated") {
    return <AuthenticatedRedirectScreen session={session} />;
  }

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
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-1">
          Welcome <span className="text-brand-yellow">Back</span>
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

      {/* Configuration notice if Supabase keys not set */}
      {!isConfigured && (
        <div className="mb-5 p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs">
          <p className="font-semibold text-amber-300 mb-0.5 flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>Supabase Setup Notice</span>
          </p>
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            Add <code className="px-1 py-0.5 rounded bg-black/40 text-amber-300 font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="px-1 py-0.5 rounded bg-black/40 text-amber-300 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your <code className="font-mono">.env.local</code> to activate live Supabase Auth.
          </p>
        </div>
      )}

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

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-full
          bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/25
          text-white text-sm font-semibold transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow
          disabled:opacity-60 disabled:cursor-not-allowed mb-5 shadow-sm group"
      >
        {isGoogleLoading ? (
          <Loader2 size={18} className="animate-spin text-brand-yellow" />
        ) : (
          <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        )}
        <span>{isGoogleLoading ? "Connecting to Google…" : "Continue with Google"}</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">
          or continue with email
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Auth Method Tabs */}
      <div className="flex p-1 bg-white/[0.04] border border-white/10 rounded-full mb-5">
        <button
          type="button"
          onClick={() => setAuthMethod("email")}
          className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all ${
            authMethod === "email"
              ? "bg-brand-yellow text-black shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Email & Password
        </button>
        <button
          type="button"
          onClick={() => setAuthMethod("phone")}
          className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            authMethod === "phone"
              ? "bg-brand-yellow text-black shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Phone OTP</span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
            Soon
          </span>
        </button>
      </div>

      {authMethod === "phone" ? (
        <div className="rounded-2xl border border-border-subtle bg-white/[0.02] p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center mx-auto text-brand-cyan">
            <Sparkles size={18} />
          </div>
          <h3 className="font-display font-bold text-sm text-white">
            Phone OTP Authentication
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            SMS one-time password login is being configured. Please sign in using Google or your email address today.
          </p>
          <button
            type="button"
            onClick={() => setAuthMethod("email")}
            className="text-xs font-semibold text-brand-yellow hover:underline mt-2 inline-block"
          >
            ← Switch back to Email Sign In
          </button>
        </div>
      ) : (
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
      )}

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
