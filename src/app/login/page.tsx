"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Printer,
  Sparkles,
  Zap,
  FileText,
  Users,
  AtSign,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  const registered = searchParams.get("registered");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === "AccessDenied"
      ? "You do not have administrator permissions to access that area."
      : null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Subtle 3D Card Tilt & Cursor Lighting
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Calculate normalized offset from -1 to 1
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    setMouseOffset({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }

      // Successful login
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage("Unable to connect to authentication server. Please try again.");
      setIsLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail("admin@starpress.in");
    setPassword("Admin@StarPress2026");
    setErrorMessage(null);
  };

  const fillDemoCustomer = () => {
    setEmail("customer@starpress.in");
    setPassword("Customer@StarPress2026");
    setErrorMessage(null);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[500px] transition-transform duration-300 ease-out will-change-transform"
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${-mouseOffset.y * 3.5}deg) rotateY(${mouseOffset.x * 3.5}deg) translateY(-2px)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)",
      }}
    >
      {/* Outer Glow Halo reacting to cursor */}
      <div
        className="pointer-events-none absolute -inset-1 rounded-[36px] bg-gradient-to-tr from-sky-500/20 via-transparent to-brand-yellow/25 blur-xl opacity-75 transition-opacity duration-500"
        style={{
          transform: `translate(${mouseOffset.x * 8}px, ${mouseOffset.y * 8}px)`,
        }}
      />

      {/* Main Glassmorphism Authentication Panel */}
      <div className="relative rounded-[32px] border border-white/[0.12] bg-[#090D1A]/75 backdrop-blur-2xl p-7 sm:p-10 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85),0_0_50px_rgba(245,186,19,0.06)] overflow-hidden">
        {/* Glowing Rim Accents: Cool Blue top-left, Warm Gold top-right */}
        <div className="pointer-events-none absolute top-0 left-0 w-44 h-44 bg-sky-400/10 rounded-full blur-2xl" />
        <div className="pointer-events-none absolute top-0 right-0 w-48 h-48 bg-brand-yellow/15 rounded-full blur-2xl" />
        <div className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-sky-400/50 via-brand-yellow/60 to-amber-400/20" />
        <div className="pointer-events-none absolute -left-px top-8 bottom-8 w-px bg-gradient-to-b from-sky-400/40 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -right-px top-8 bottom-8 w-px bg-gradient-to-b from-amber-400/40 via-transparent to-transparent" />

        {/* Card Header */}
        <div className="text-center space-y-3 mb-7 relative z-10">
          {/* Official Brand Logo Hallmark */}
          <div className="flex justify-center mb-1">
            <div className="relative h-14 w-40 transition-transform duration-300 hover:scale-105">
              <Image
                src="/images/Logo.png"
                alt="Star Press - The Printing Hub"
                fill
                sizes="180px"
                priority
                className="object-contain drop-shadow-[0_0_25px_rgba(245,186,19,0.35)]"
              />
            </div>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            Welcome <span className="text-brand-yellow">Back</span>
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 max-w-xs mx-auto leading-relaxed">
            Sign in to track print jobs, access corporate invoices, or manage print orders.
          </p>
        </div>

        {/* Registration Success Banner */}
        {registered && (
          <div className="mb-5 flex items-start gap-3 p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs backdrop-blur-md">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
            <span>Account created successfully! Please log in with your credentials.</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-3 p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wide block">
              Email Address
            </label>
            <div className="relative group">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-[#0E1322]/80 border border-white/[0.12] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20 group-hover:border-white/20 transition-all duration-200 shadow-inner"
              />
              <AtSign
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-yellow transition-colors pointer-events-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 tracking-wide block">
                Password
              </label>
              <Link
                href="/contact?topic=PasswordReset"
                className="text-xs font-medium text-brand-yellow/90 hover:text-brand-yellow hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0E1322]/80 border border-white/[0.12] rounded-2xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20 group-hover:border-white/20 transition-all duration-200 shadow-inner"
              />
              <Lock
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-yellow transition-colors pointer-events-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Sign In Primary CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative group overflow-hidden !mt-6 rounded-2xl py-3.5 px-6 font-display font-extrabold text-sm uppercase tracking-wider text-black bg-gradient-to-r from-[#F5BA13] via-[#FFCA28] to-[#E5A800] shadow-[0_6px_28px_rgba(245,186,19,0.38)] hover:shadow-[0_8px_36px_rgba(245,186,19,0.55)] active:translate-y-0.5 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {/* Subtle light sweep reflection on hover */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />

            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 relative z-10">
                <span>Sign In to Star Press</span>
                <ArrowRight
                  size={16}
                  className="stroke-[2.5] group-hover:translate-x-1.5 transition-transform duration-200"
                />
              </span>
            )}
          </button>
        </form>

        {/* Elegant OR Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <span className="relative px-3 bg-[#090D1A] text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            OR
          </span>
        </div>

        {/* Developer / Administrator Quick Access */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center space-y-2.5 backdrop-blur-md">
          <div className="text-xs text-slate-300 font-medium flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-brand-yellow fill-brand-yellow/30" />
            <span>Developer / Administrator Quick Access</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="flex-1 py-2 px-3 rounded-xl bg-brand-yellow/10 hover:bg-brand-yellow/20 border border-brand-yellow/30 hover:border-brand-yellow/50 text-xs text-slate-200 hover:text-white transition-all duration-200 flex items-center justify-center gap-1.5 font-medium group"
            >
              <span>Fill Admin Credentials</span>
              <span className="text-brand-yellow font-mono text-[11px] group-hover:underline">
                (admin@starpress.in)
              </span>
            </button>
            <button
              type="button"
              onClick={fillDemoCustomer}
              className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs text-slate-400 hover:text-slate-200 transition-all duration-200 font-medium"
              title="Fill Customer Test Account"
            >
              Customer Test
            </button>
          </div>
        </div>

        {/* Security Indicator */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
          <span>256-bit encrypted authentication session</span>
        </div>
      </div>

      {/* Switch to Register */}
      <div className="text-center mt-6 text-xs text-slate-400">
        Don&apos;t have a Star Press account yet?{" "}
        <Link
          href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-brand-yellow font-semibold hover:text-[#FFE04D] hover:underline transition-colors"
        >
          Create Customer Account →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleGlobalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = Math.round((clientX / innerWidth) * 100);
    const y = Math.round((clientY / innerHeight) * 100);
    setMousePos({ x, y });
  };

  return (
    <div
      onMouseMove={handleGlobalMouseMove}
      className="relative min-h-screen flex flex-col justify-between bg-[#06070B] text-white selection:bg-brand-yellow selection:text-black overflow-x-hidden"
    >
      {/* 1. PHOTOREALISTIC PRINTING WORKSPACE BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Background Image: Commercial Digital Press Machine */}
        <div className="absolute inset-0 opacity-40 mix-blend-luminosity scale-105">
          <Image
            src="/images/auth-press-bg.jpg"
            alt="Star Press Commercial Printing Environment"
            fill
            priority
            className="object-cover object-right md:object-center"
            sizes="100vw"
            quality={90}
          />
        </div>

        {/* Ambient Dark Gradient Overlays for High Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06070B] via-[#06070B]/90 to-[#06070B]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06070B] via-transparent to-[#06070B]/80" />

        {/* Amber Floor Reflection Lines (matching the reference image) */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-brand-yellow/[0.08] to-transparent" />
        <div className="absolute bottom-16 left-1/4 right-0 h-px bg-gradient-to-r from-transparent via-brand-yellow/40 to-transparent blur-[1px]" />
        <div className="absolute bottom-28 left-1/3 right-12 h-px bg-gradient-to-r from-transparent via-brand-yellow/20 to-transparent blur-[2px]" />

        {/* Interactive Ambient Cursor Spotlight */}
        <div
          className="absolute inset-0 transition-opacity duration-700 opacity-60"
          style={{
            background: `radial-gradient(750px circle at ${mousePos.x}% ${mousePos.y}%, rgba(245,186,19,0.09), transparent 70%)`,
          }}
        />

        {/* Cool Blue Ambient Rim Behind Center Card */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. TOP HEADER NAVIGATION BAR */}
      <header className="relative z-20 w-full max-w-[1400px] mx-auto px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow rounded-xl"
          aria-label="Star Press — The Printing Hub"
        >
          <Image
            src="/images/Logo.png"
            alt="Star Press - The Printing Hub"
            width={160}
            height={52}
            priority
            className="h-10 sm:h-12 w-auto object-contain group-hover:scale-[1.03] transition-transform duration-200"
          />
        </Link>

        {/* Slogan */}
        <div className="hidden sm:flex items-center gap-2.5 text-xs font-semibold tracking-widest uppercase text-slate-400">
          <span>Print Smarter</span>
          <span className="text-brand-yellow font-bold">•</span>
          <span>Work Faster</span>
        </div>
      </header>

      {/* 3. MAIN SPATIAL CANVAS */}
      <main className="relative z-10 flex-1 max-w-[1400px] w-full mx-auto px-6 sm:px-10 py-6 sm:py-10 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-center">
          {/* Left Column: Brand Statement & Spatial Indicators */}
          <div className="lg:col-span-6 xl:col-span-5 hidden lg:block space-y-8 pl-2">
            {/* Timeline Vertical Accent with Glowing Node */}
            <div className="relative pl-6 border-l border-brand-yellow/25 space-y-7">
              {/* Glowing Amber Pinpoint Node */}
              <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-brand-yellow shadow-[0_0_14px_#F5BA13]" />

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest font-bold text-brand-yellow/90 font-mono">
                  Enterprise Portal
                </p>
                <h2 className="font-display font-extrabold text-3xl xl:text-4xl text-white tracking-tight leading-[1.15]">
                  Your <br />
                  <span className="text-white">Printing Workspace</span>
                </h2>
                <div className="space-y-1 text-sm text-slate-400 font-normal leading-relaxed pt-1">
                  <p>Track jobs in real time.</p>
                  <p>Manage commercial orders.</p>
                  <p>Print without limits.</p>
                </div>
              </div>

              {/* 3 Feature Pills */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md hover:border-brand-yellow/40 hover:bg-white/[0.05] transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-brand-yellow shrink-0 group-hover:scale-105 transition-transform">
                    <Zap size={18} className="fill-brand-yellow/20" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white tracking-wide">Fast</p>
                    <p className="text-[11px] text-slate-400">Print Tracking & Live Dispatch</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md hover:border-brand-yellow/40 hover:bg-white/[0.05] transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-brand-yellow shrink-0 group-hover:scale-105 transition-transform">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white tracking-wide">Corporate</p>
                    <p className="text-[11px] text-slate-400">Invoice & GST Management</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md hover:border-brand-yellow/40 hover:bg-white/[0.05] transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-brand-yellow shrink-0 group-hover:scale-105 transition-transform">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white tracking-wide">Built for</p>
                    <p className="text-[11px] text-slate-400">Teams & Multi-Brand Accounts</p>
                  </div>
                </div>
              </div>

              {/* Sub-label */}
              <div className="pt-2">
                <span className="text-xs text-slate-500 font-medium tracking-wide">
                  Powered by Star Press Production Cloud
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Spatial Glass Login Form */}
          <div className="lg:col-span-6 xl:col-span-7 flex justify-center lg:justify-end">
            <Suspense
              fallback={
                <div className="w-full max-w-[500px] h-[550px] rounded-[32px] border border-white/10 bg-[#090D1A]/70 backdrop-blur-2xl flex flex-col items-center justify-center text-slate-400 gap-3">
                  <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs tracking-wider uppercase">Loading Workspace...</p>
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>

      {/* 4. FOOTER BAR */}
      <footer className="relative z-20 w-full max-w-[1400px] mx-auto px-6 sm:px-10 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <p>© 2026 Star Press. All rights reserved.</p>
        <p className="hidden md:block text-slate-400/80 font-medium">
          Ideas to Printed Realities.
        </p>
        <p className="text-slate-400 font-medium">
          Reliable Printing for a Brighter Tomorrow.
        </p>
      </footer>
    </div>
  );
}
