"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Printer,
  Sparkles,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";

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

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Icon Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/30 flex items-center justify-center mx-auto text-brand-yellow shadow-lg shadow-brand-yellow/5">
          <Printer size={28} />
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
          Welcome Back
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary">
          Sign in to track print jobs, access corporate invoices, or manage print orders.
        </p>
      </div>

      {/* Card Container */}
      <div className="rounded-3xl border border-border-subtle bg-bg-surface p-7 sm:p-9 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-sm">
        {/* Registration Success Banner */}
        {registered && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>Account created successfully! Please log in with your credentials.</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-bg-surface-alt border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-colors"
              />
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                Password
              </label>
              <Link
                href="/contact?topic=PasswordReset"
                className="text-[11px] text-brand-yellow/90 hover:text-brand-yellow hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-surface-alt border border-border-subtle rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-colors"
              />
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full justify-center !py-3 !mt-6 text-sm font-bold uppercase tracking-wider !bg-brand-yellow !text-black hover:!bg-[#FFE04D]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Sign In to Star Press</span>
                <ArrowRight size={16} />
              </span>
            )}
          </Button>
        </form>

        {/* Quick Demo Credentials for Fast Testing */}
        <div className="pt-4 border-t border-border-subtle/80 text-center space-y-2">
          <div className="text-[11px] text-text-muted font-medium flex items-center justify-center gap-1.5">
            <Sparkles size={12} className="text-brand-yellow" />
            <span>Developer / Administrator Quick Test</span>
          </div>
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="text-xs px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-surface-alt text-slate-300 hover:text-white hover:border-brand-yellow/50 transition-colors"
          >
            Fill Admin Credentials (<span className="text-brand-yellow font-mono">admin@starpress.in</span>)
          </button>
        </div>

        {/* Security Reassurance */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-text-muted">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>256-bit encrypted authentication session</span>
        </div>
      </div>

      {/* Switch to Register */}
      <div className="text-center mt-6 text-xs text-text-secondary">
        Don&apos;t have a Star Press account yet?{" "}
        <Link
          href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-brand-yellow font-semibold hover:underline"
        >
          Create Customer Account →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-12 md:py-20 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="text-center text-text-muted py-20">
              <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs">Loading sign-in interface...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
