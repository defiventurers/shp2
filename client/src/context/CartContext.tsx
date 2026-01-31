import { createContext, useContext, type ReactNode, useState } from "react";
import { useCart } from "@/hooks/useCart";
import type { Prescription } from "@shared/schema";

interface CartContextType {
  /* Cart (existing – untouched) */
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

  /* Prescriptions (UPDATED) */
  prescriptions: Prescription[];
  selectedPrescriptionIds: string[];

  addPrescription: (p: Prescription) => void;
  togglePrescription: (id: string) => void;
  deletePrescription: (id: string) => void;
  clearSelectedPrescriptions: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptionIds, setSelectedPrescriptionIds] = useState<
    string[]
  >([]);

  /* ---------------------------
     Prescription helpers
  ---------------------------- */

  function addPrescription(p: Prescription) {
    setPrescriptions((prev) => [p, ...prev]);

    // auto-select newly uploaded prescription
    setSelectedPrescriptionIds((prev) => [...prev, p.id]);
  }

  function togglePrescription(id: string) {
    setSelectedPrescriptionIds((prev) =>
      prev.includes(id)
        ? prev.filter((pid) => pid !== id)
        : [...prev, id]
    );
  }

  function deletePrescription(id: string) {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
    setSelectedPrescriptionIds((prev) => prev.filter((pid) => pid !== id));
  }

  function clearSelectedPrescriptions() {
    setSelectedPrescriptionIds([]);
  }

  return (
    <CartContext.Provider
      value={{
        /* cart */
        ...cart,

        /* prescriptions */
        prescriptions,
        selectedPrescriptionIds,

        addPrescription,
        togglePrescription,
        deletePrescription,
        clearSelectedPrescriptions,
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