import { useState, useEffect, useCallback } from "react";
import type { Medicine, CartItem } from "@shared/schema";

const CART_STORAGE_KEY = "sacred_heart_cart";

/**
 * Safely converts any price input to a usable number.
 * Handles: null, undefined, "", "₹112", "112.00"
 */
function safePrice(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /* -----------------------------
     LOAD FROM STORAGE
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
     PERSIST TO STORAGE
  ------------------------------ */
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  /* -----------------------------
     CART ACTIONS
     (NEVER BLOCK ADD)
  ------------------------------ */
  const addItem = useCallback((medicine: Medicine, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.medicine.id === medicine.id
      );

      if (existing) {
        return prev.map((item) =>
          item.medicine.id === medicine.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, { medicine, quantity }];
    });
  }, []);

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
     DERIVED STATE (SAFE)
  ------------------------------ */
  const itemCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = items.reduce((sum, item) => {
    const price = safePrice(
      (item.medicine as any).price ??
      (item.medicine as any).mrp
    );
    return sum + price * item.quantity;
  }, 0);

  const hasScheduleHDrugs = items.some(
    (item) => item.medicine.isScheduleH === true
  );

  const requiresPrescription = items.some(
    (item) => item.medicine.requiresPrescription === true
  );

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