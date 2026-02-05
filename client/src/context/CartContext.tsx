import { createContext, useContext, useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { Prescription } from "@shared/schema";

export interface CartContextType {
  // CART
  items: {
    id: string;
    name: string;
    price: number;
    qty: number;
    requiresPrescription?: boolean;
  }[];

  addItem: (item: {
    id: string;
    name: string;
    price: number;
    requiresPrescription?: boolean;
  }) => void;

  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;

  itemCount: number;
  subtotal: number;
  hasScheduleHDrugs: boolean;
  requiresPrescription: boolean;
  isLoaded: boolean;

  // PRESCRIPTIONS
  prescriptions: Prescription[];
  selectedPrescriptionId: string | null;
  setSelectedPrescriptionId: (id: string | null) => void;
  refreshPrescriptions: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  /**
   * 🔑 CART LOGIC (LOCAL + PERSISTED)
   */
  const cart = useCart();

  /**
   * 🩺 PRESCRIPTIONS
   */
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] =
    useState<string | null>(null);

  async function refreshPrescriptions() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions`,
        { credentials: "include" }
      );

      if (!res.ok) return;

      const data: Prescription[] = await res.json();
      setPrescriptions(data);

      if (!selectedPrescriptionId && data.length > 0) {
        setSelectedPrescriptionId(data[0].id);
      }
    } catch {
      // silent fail
    }
  }

  useEffect(() => {
    refreshPrescriptions();
  }, []);

  return (
    <CartContext.Provider
      value={{
        // 🛒 CART
        items: cart.items,
        addItem: cart.addItem,
        removeItem: cart.removeItem,
        updateQuantity: cart.updateQuantity,
        clearCart: cart.clearCart,

        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        hasScheduleHDrugs: cart.hasScheduleHDrugs,
        requiresPrescription: cart.requiresPrescription,
        isLoaded: cart.isLoaded,

        // 🩺 PRESCRIPTIONS
        prescriptions,
        selectedPrescriptionId,
        setSelectedPrescriptionId,
        refreshPrescriptions,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return ctx;
}