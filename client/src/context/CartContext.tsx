import { createContext, useContext, useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import type { Prescription } from "@shared/schema";

const SELECTED_PRESCRIPTION_STORAGE_KEY = "selectedPrescriptionId";
const REQUESTED_ITEMS_STORAGE_KEY = "requestedItems";

export type RequestedItem = {
  id: string;
  name: string;
  quantity: number;
  customerNotes?: string;
};

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

  // REQUESTED ITEMS
  requestedItems: RequestedItem[];
  setRequestedItems: (items: RequestedItem[]) => void;
  clearRequestedItems: () => void;

  // PRESCRIPTIONS
  prescriptions: Prescription[];
  selectedPrescriptionId: string | null;
  selectedPrescription: Prescription | null;
  setSelectedPrescriptionId: (id: string | null) => void;
  refreshPrescriptions: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const { user } = useAuth();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] =
    useState<string | null>(null);
  const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);

  useEffect(() => {
    const storedId = localStorage.getItem(SELECTED_PRESCRIPTION_STORAGE_KEY);
    if (storedId) {
      setSelectedPrescriptionId(storedId);
    }

    const storedRequested = localStorage.getItem(REQUESTED_ITEMS_STORAGE_KEY);
    if (storedRequested) {
      try {
        const parsed = JSON.parse(storedRequested);
        if (Array.isArray(parsed)) {
          setRequestedItems(parsed);
        }
      } catch {
        setRequestedItems([]);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedPrescriptionId) {
      localStorage.setItem(SELECTED_PRESCRIPTION_STORAGE_KEY, selectedPrescriptionId);
    } else {
      localStorage.removeItem(SELECTED_PRESCRIPTION_STORAGE_KEY);
    }
  }, [selectedPrescriptionId]);

  useEffect(() => {
    localStorage.setItem(REQUESTED_ITEMS_STORAGE_KEY, JSON.stringify(requestedItems));
  }, [requestedItems]);

  function clearRequestedItems() {
    setRequestedItems([]);
    localStorage.removeItem(REQUESTED_ITEMS_STORAGE_KEY);
  }

  async function refreshPrescriptions() {
    if (!user) {
      setPrescriptions([]);
      setSelectedPrescriptionId(null);
      localStorage.removeItem(SELECTED_PRESCRIPTION_STORAGE_KEY);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions`,
        { credentials: "include" }
      );

      if (!res.ok) return;

      const data: Prescription[] = await res.json();
      setPrescriptions(data);

      if (selectedPrescriptionId) {
        const exists = data.some((p) => p.id === selectedPrescriptionId);
        if (!exists) {
          setSelectedPrescriptionId(data[0]?.id || null);
        }
        return;
      }

      if (data.length > 0) {
        setSelectedPrescriptionId(data[0].id);
      }
    } catch {
      // silent fail
    }
  }

  useEffect(() => {
    refreshPrescriptions();
  }, [user?.id]);

  const selectedPrescription =
    prescriptions.find((p) => p.id === selectedPrescriptionId) || null;

  return (
    <CartContext.Provider
      value={{
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

        requestedItems,
        setRequestedItems,
        clearRequestedItems,

        prescriptions,
        selectedPrescriptionId,
        selectedPrescription,
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
