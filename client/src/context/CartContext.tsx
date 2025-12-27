import { createContext, useContext, type ReactNode, useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { Medicine, CartItem, Prescription } from "@shared/schema";

interface CartContextType {
  // CART
  items: CartItem[];
  addItem: (medicine: Medicine, quantity?: number) => void;
  removeItem: (medicineId: string) => void;
  updateQuantity: (medicineId: string, quantity: number) => void;
  clearCart: () => void;

  itemCount: number;
  subtotal: number;
  hasScheduleHDrugs: boolean;
  requiresPrescription: boolean;
  isLoaded: boolean;

  // PRESCRIPTIONS
  prescriptions: Prescription[];
  selectedPrescriptionId: string | null;
  addPrescription: (p: Prescription) => void;
  deletePrescription: (id: string) => void;
  selectPrescription: (id: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart();

  // ✅ ALWAYS SAFE DEFAULTS
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] =
    useState<string | null>(null);

  function addPrescription(p: Prescription) {
    setPrescriptions((prev) => {
      if (prev.find((x) => x.id === p.id)) return prev;
      return [p, ...prev];
    });
    setSelectedPrescriptionId(p.id);
  }

  function deletePrescription(id: string) {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
    if (selectedPrescriptionId === id) {
      setSelectedPrescriptionId(null);
    }
  }

  function selectPrescription(id: string | null) {
    setSelectedPrescriptionId(id);
  }

  return (
    <CartContext.Provider
      value={{
        // CART (from useCart)
        ...cart,

        // PRESCRIPTION STATE
        prescriptions,
        selectedPrescriptionId,
        addPrescription,
        deletePrescription,
        selectPrescription,
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