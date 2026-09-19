"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Printer,
  CheckCircle,
  Check,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { evaluatePassword, PASSWORD_MIN_LENGTH } from "@/lib/validation/auth";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordEvaluation = evaluatePassword(formData.password);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!passwordEvaluation.isValid) {
      setErrorMessage(
        passwordEvaluation.errors[0] ||
          `Password must be at least ${PASSWORD_MIN_LENGTH} characters long with uppercase, lowercase, numbers, and special characters.`
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

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
        setErrorMessage(data.error || "Failed to create account.");
        setIsLoading(false);
        return;
      }

      // Redirect to login with success indicator
      router.push(
        `/login?registered=true${
          callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
        }`
      );
    } catch (err) {
      setErrorMessage("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Icon Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/30 flex items-center justify-center mx-auto text-brand-yellow shadow-lg shadow-brand-yellow/5">
          <Printer size={28} />
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
          Create Account
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary">
          Join Star Press to track orders, save delivery addresses, and unlock B2B corporate print discounts.
        </p>
      </div>

      {/* Card Container */}
      <div className="rounded-3xl border border-border-subtle bg-bg-surface p-7 sm:p-9 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-sm">
        {/* Error Banner */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Rohan Sharma"
                className="w-full bg-bg-surface-alt border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-colors"
              />
              <User
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="rohan@company.in"
                className="w-full bg-bg-surface-alt border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-colors"
              />
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Mobile Number (For WhatsApp Proofs & Courier AWB)
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="9876543210"
                className="w-full bg-bg-surface-alt border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-colors"
              />
              <Phone
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimum 6 characters"
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

            {/* Password Strength Meter */}
            {formData.password && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Password Strength:</span>
                  <span
                    className={`font-semibold capitalize ${
                      passwordEvaluation.strength === "strong"
                        ? "text-emerald-400"
                        : passwordEvaluation.strength === "good"
                        ? "text-amber-400"
                        : passwordEvaluation.strength === "fair"
                        ? "text-yellow-500"
                        : "text-rose-400"
                    }`}
                  >
                    {passwordEvaluation.strength}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`rounded-full transition-all duration-300 ${
                        passwordEvaluation.score >= step
                          ? passwordEvaluation.strength === "strong"
                            ? "bg-emerald-500"
                            : passwordEvaluation.strength === "good"
                            ? "bg-amber-400"
                            : passwordEvaluation.strength === "fair"
                            ? "bg-yellow-500"
                            : "bg-rose-500"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        formData.password.length >= PASSWORD_MIN_LENGTH
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-white/5 text-slate-500 border border-white/10"
                      }`}
                    >
                      ✓
                    </span>
                    <span>12+ characters</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password)
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-white/5 text-slate-500 border border-white/10"
                      }`}
                    >
                      ✓
                    </span>
                    <span>Upper & lower case</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        /[0-9]/.test(formData.password)
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-white/5 text-slate-500 border border-white/10"
                      }`}
                    >
                      ✓
                    </span>
                    <span>At least 1 number</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password)
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-white/5 text-slate-500 border border-white/10"
                      }`}
                    >
                      ✓
                    </span>
                    <span>Special character</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter password"
                className="w-full bg-bg-surface-alt border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-colors"
              />
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>

          {/* Perks checklist */}
          <div className="pt-2 space-y-1.5 text-[11px] text-text-secondary">
            <div className="flex items-center gap-2">
              <CheckCircle size={13} className="text-emerald-400 shrink-0" />
              <span>Free digital 3D soft proof review on all orders</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={13} className="text-emerald-400 shrink-0" />
              <span>Saved multiple delivery destinations (Offices, Warehouses)</span>
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
                <span>Creating Account...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Create Star Press Account</span>
                <ArrowRight size={16} />
              </span>
            )}
          </Button>
        </form>

        {/* Security Reassurance */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-text-muted">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Your data and uploaded artworks are strictly confidential</span>
        </div>
      </div>

      {/* Switch to Login */}
      <div className="text-center mt-6 text-xs text-text-secondary">
        Already have a Star Press account?{" "}
        <Link
          href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-brand-yellow font-semibold hover:underline"
        >
          Sign In Here →
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-12 md:py-20 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="text-center text-text-muted py-20">
              <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs">Loading registration...</p>
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
