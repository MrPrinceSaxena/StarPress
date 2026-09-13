"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageSrc: string;
  quantity: number;
  href: string;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (
    product: {
      id: string;
      name: string;
      price: number;
      imageSrc: string;
      href?: string;
    },
    quantity?: number
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "starpress_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        // Initial sample items for demonstration
        setItems([
          {
            id: "prod-1",
            name: "Premium Business Cards",
            price: 299,
            quantity: 1,
            imageSrc: "/images/prod-business-cards.jpg",
            href: "/shop/business-cards",
          },
          {
            id: "prod-2",
            name: "A4 Flyers",
            price: 499,
            quantity: 1,
            imageSrc: "/images/prod-flyers.jpg",
            href: "/shop/flyers",
          },
          {
            id: "prod-4",
            name: "Custom Stickers",
            price: 299,
            quantity: 1,
            imageSrc: "/images/prod-stickers.jpg",
            href: "/shop/stickers",
          },
        ]);
      }
    } catch {
      // Ignore localStorage read errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Ignore localStorage write errors
      }
    }
  }, [items, isLoaded]);

  const addItem = (
    product: {
      id: string;
      name: string;
      price: number;
      imageSrc: string;
      href?: string;
    },
    quantity = 1
  ) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          imageSrc: product.imageSrc,
          quantity,
          href: product.href || `/shop/${product.id}`,
        },
      ];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
