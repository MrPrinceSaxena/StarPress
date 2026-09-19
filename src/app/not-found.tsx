import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { ArrowLeft, Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary">
      <Header />

      <main className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="max-w-md w-full text-center space-y-6">
          {/* 404 badge */}
          <div className="relative inline-block">
            <span className="font-display font-black text-8xl sm:text-9xl text-brand-yellow tracking-tighter">
              404
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">
              Page Not Found
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              The page you are looking for might have been moved, renamed, or doesn&apos;t exist yet. Let&apos;s get you back on track!
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              href="/"
              className="w-full sm:w-auto"
            >
              <Home size={16} />
              <span>Back to Home</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              href="/shop"
              className="w-full sm:w-auto"
            >
              <Search size={16} />
              <span>Browse Catalog</span>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
