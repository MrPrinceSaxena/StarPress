"use client";

import React from "react";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </CartProvider>
  );
}
