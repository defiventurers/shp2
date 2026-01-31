import { createContext, useContext, useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { Prescription } from "@shared/schema";

interface CartContextType {
  // cart
  items: any[];
  addItem: any;
  removeItem: any;
  updateQuantity: any;
  clearCart: () => void;

  itemCount: number;
  subtotal: number;
  hasScheduleHDrugs: boolean;
  requiresPrescription: boolean;
  isLoaded: boolean;

  // prescriptions
  prescriptions: Prescription[];
  selectedPrescriptionId: string | null;
  setSelectedPrescriptionId: (id: string | null) => void;
  refreshPrescriptions: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] =
    useState<string | null>(null);

  // 🔑 Fetch from backend (SOURCE OF TRUTH)
  async function refreshPrescriptions() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      const data = await res.json();
      setPrescriptions(data);
    } catch {
      // ignore
    }
  }

  // Load once on app start
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
  if (!ctx) throw new Error("useCartContext must be used within CartProvider");
  return ctx;
}