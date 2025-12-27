import { createContext, useContext, type ReactNode } from "react";
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
  deletePrescription: (id: string) => void;
  selectPrescription: (id: string | null) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart();

  // 🔥 IMPORTANT: keep these OUTSIDE useCart
  const prescriptions: Prescription[] = [];
  const selectedPrescriptionId: string | null = null;

  function addPrescription(_: Prescription) {}
  function deletePrescription(_: string) {}
  function selectPrescription(_: string | null) {}

  return (
    <CartContext.Provider
      value={{
        ...cart,
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