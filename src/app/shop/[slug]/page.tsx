import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StarRating from "@/components/ui/StarRating";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductConfigurator from "@/components/shop/ProductConfigurator";
import ProductTabs from "@/components/shop/ProductTabs";
import CatalogProductCard from "@/components/shop/CatalogProductCard";
import {
  getAllProducts,
  getProductBySlug,
  getProductsByCategory,
} from "@/lib/catalog";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const products = getAllProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  if (!product) {
    return {
      title: "Product Not Found | Star Press",
    };
  }

  return {
    title: `${product.name} — Custom Printing & Instant Pricing | Star Press`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} | Star Press`,
      description: product.shortDescription,
      images: [
        {
          url: product.images[0] || "/images/hero-composition.jpg",
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
    },
  };
}

export default function ProductDetailPage({ params }: PageProps) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  // Related products from the same category
  const relatedProducts = getProductsByCategory(product.categorySlug)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 lg:px-10 py-8 md:py-12">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-text-muted mb-8 overflow-x-auto whitespace-nowrap"
        >
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight size={13} />
          <Link href="/shop" className="hover:text-white transition-colors">
            Shop
          </Link>
          <ChevronRight size={13} />
          <Link
            href={`/shop?category=${product.categorySlug}`}
            className="hover:text-white transition-colors"
          >
            {product.categoryName}
          </Link>
          <ChevronRight size={13} />
          <span className="text-white font-medium truncate">{product.name}</span>
        </nav>

        {/* 2-Column Product Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Gallery & Title */}
          <div className="lg:col-span-6 space-y-6 lg:sticky lg:top-28">
            <ProductGallery images={product.images} productName={product.name} />

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan uppercase tracking-wider">
                  {product.categoryName}
                </span>
                <StarRating rating={product.rating} reviewCount={product.reviewCount} />
              </div>

              <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight leading-[1.1]">
                {product.name}
              </h1>

              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                {product.shortDescription}
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Multi-Attribute Price Configurator */}
          <div className="lg:col-span-6">
            <ProductConfigurator product={product} />
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <ProductTabs product={product} />

        {/* Related Products Recommendation */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-border-subtle space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-2xl text-white tracking-tight">
                  Related in {product.categoryName}
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary mt-1">
                  Customers ordering this item also frequently print these formats.
                </p>
              </div>

              <Link
                href={`/shop?category=${product.categorySlug}`}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-brand-cyan hover:underline"
              >
                <span>View all category items</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <CatalogProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
