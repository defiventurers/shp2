import { createContext, useContext, type ReactNode, useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { Medicine, CartItem, Prescription } from "@shared/schema";

interface CartContextType {
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

  prescriptions: Prescription[];
  selectedPrescriptionId: string | null;
  addPrescription: (p: Prescription) => void;
  selectPrescription: (id: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart();

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

  function selectPrescription(id: string | null) {
    setSelectedPrescriptionId(id);
  }

  return (
    <CartContext.Provider
      value={{
        ...cart,
        prescriptions,
        selectedPrescriptionId,
        addPrescription,
        selectPrescription,
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