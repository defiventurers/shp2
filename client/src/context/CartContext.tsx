import { createContext, useContext, type ReactNode, useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { Prescription } from "@shared/schema";

interface CartContextType {
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

  prescriptions: Prescription[];
  selectedPrescriptionId: string | null;

  addPrescription: (p: Prescription) => void;
  selectPrescription: (id: string) => void;
  deletePrescription: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] =
    useState<string | null>(null);

  function addPrescription(p: Prescription) {
    setPrescriptions((prev) => [p, ...prev]);
    setSelectedPrescriptionId(p.id); // auto-select latest
  }

  function selectPrescription(id: string) {
    setSelectedPrescriptionId(id);
  }

  function deletePrescription(id: string) {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));

    if (selectedPrescriptionId === id) {
      setSelectedPrescriptionId(null);
    }
  }

  return (
    <CartContext.Provider
      value={{
        ...cart,
        prescriptions,
        selectedPrescriptionId,
        addPrescription,
        selectPrescription,
        deletePrescription,
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