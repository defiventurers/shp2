import { useState, useEffect, useCallback } from "react";
import type { Medicine, CartItem } from "@shared/schema";

const CART_STORAGE_KEY = "sacred_heart_cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /* -----------------------------
     Load from localStorage
  ------------------------------ */
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        setItems([]);
      }
    }
    setIsLoaded(true);
  }, []);

  /* -----------------------------
     Persist to localStorage
  ------------------------------ */
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  /* -----------------------------
     Cart actions
  ------------------------------ */
  const addItem = useCallback(
    (medicine: Medicine, quantity: number = 1) => {
      setItems((prev) => {
        const existing = prev.find(
          (item) => item.medicine.id === medicine.id
        );

        if (existing) {
          return prev.map((item) =>
            item.medicine.id === medicine.id
              ? {
                  ...item,
                  quantity: Math.min(
                    item.quantity + quantity,
                    medicine.stock
                  ),
                }
              : item
          );
        }

        return [...prev, { medicine, quantity }];
      });
    },
    []
  );

  const removeItem = useCallback((medicineId: string) => {
    setItems((prev) =>
      prev.filter((item) => item.medicine.id !== medicineId)
    );
  }, []);

  const updateQuantity = useCallback(
    (medicineId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(medicineId);
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.medicine.id === medicineId
            ? { ...item, quantity }
            : item
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /* -----------------------------
     Derived values
  ------------------------------ */
  const itemCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (sum, item) =>
      sum + Number(item.medicine.price) * item.quantity,
    0
  );

  // ✅ SINGLE SOURCE OF TRUTH
  const hasScheduleHDrugs = items.some(
    (item) => item.medicine.isScheduleH
  );

  const requiresPrescription = hasScheduleHDrugs;

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
    hasScheduleHDrugs,
    requiresPrescription,
    isLoaded,
  };
}