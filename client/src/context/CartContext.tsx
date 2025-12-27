import { createContext, useContext, useState } from "react";
import type { Prescription } from "@shared/schema";

interface CartContextType {
  prescriptions: Prescription[];
  selectedPrescriptionId: string | null;
  addPrescription: (p: Prescription) => void;
  deletePrescription: (id: string) => void;
  selectPrescription: (id: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] =
    useState<string | null>(null);

  function addPrescription(p: Prescription) {
    setPrescriptions((prev) => [p, ...prev]);
    setSelectedPrescriptionId(p.id);
  }

  function deletePrescription(id: string) {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
    if (selectedPrescriptionId === id) {
      setSelectedPrescriptionId(null);
    }
  }

  function selectPrescription(id: string) {
    setSelectedPrescriptionId(id);
  }

  return (
    <CartContext.Provider
      value={{
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
  if (!ctx) throw new Error("CartContext missing");
  return ctx;
}