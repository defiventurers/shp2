import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import type { Medicine } from "@shared/schema";

interface Props {
  medicine: Medicine;
}

export function MedicineCard({ medicine }: Props) {
  const { addItem, updateQuantity, items } = useCartContext();
  const [open, setOpen] = useState(false);

  const cartItem = items.find(
    (i) => i.medicine.id === medicine.id
  );

  const quantity = cartItem?.quantity ?? 0;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {/* TOP ROW */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold leading-tight">
            {medicine.name}
          </h3>

          <div className="mt-1 text-lg font-bold text-black">
            ₹{medicine.price}
          </div>

          {/* ✅ PACK SIZE — ALWAYS VISIBLE */}
          {medicine.packSize && (
            <div className="mt-1 text-sm text-muted-foreground">
              Pack size: {medicine.packSize} tablets / capsules
            </div>
          )}
        </div>

        {/* INFO ICON */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground"
        >
          <Info size={18} />
        </button>
      </div>

      {/* ADD / QUANTITY CONTROL */}
      <div className="mt-4 flex justify-end">
        {quantity === 0 ? (
          <Button
            onClick={() => addItem(medicine, 1)}
            className="rounded-full px-6"
          >
            + Add
          </Button>
        ) : (
          <div className="flex items-center gap-3 rounded-full border px-3 py-1">
            <button
              onClick={() =>
                updateQuantity(medicine.id, quantity - 1)
              }
              className="text-lg font-bold"
            >
              −
            </button>

            <span className="min-w-[16px] text-center text-sm font-semibold">
              {quantity}
            </span>

            <button
              onClick={() =>
                updateQuantity(medicine.id, quantity + 1)
              }
              className="text-lg font-bold"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* 🔽 OPTIONAL DETAILS */}
      {open && (
        <div className="mt-4 space-y-3 border-t pt-4 text-sm">
          {/* IMAGE */}
          <div className="flex justify-center">
            {medicine.imageUrls?.[0] ? (
              <img
                src={medicine.imageUrls[0]}
                alt={medicine.name}
                className="h-24 rounded object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/placeholder-medicine.png";
                }}
              />
            ) : (
              <div className="rounded bg-muted px-4 py-2 text-xs text-muted-foreground">
                Image not available
              </div>
            )}
          </div>

          {/* MANUFACTURER */}
          {medicine.manufacturer && (
            <div>
              <span className="font-medium">Manufacturer:</span>{" "}
              {medicine.manufacturer}
            </div>
          )}

          {/* RX WARNING */}
          {medicine.requiresPrescription && (
            <div className="text-red-600">
              Prescription required
            </div>
          )}
        </div>
      )}
    </div>
  );
}