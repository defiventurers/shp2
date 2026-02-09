import { createContext, useContext, useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { Prescription } from "@shared/schema";

type CartContextType = {
  items: any[];
  addItem: (medicine: any, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;

  itemCount: number;
  subtotal: number;
  hasScheduleHDrugs: boolean;
  requiresPrescription: boolean;
  isLoaded: boolean;

  prescriptions: Prescription[];
  selectedPrescriptionId: string | null;
  setSelectedPrescriptionId: (id: string | null) => void;
  refreshPrescriptions: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart();

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
        ...cart,
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