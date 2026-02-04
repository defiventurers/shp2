import { useState } from "react";
import type { Medicine } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";
import { Info } from "lucide-react";

interface Props {
  medicine: Medicine;
}

export function MedicineCard({ medicine }: Props) {
  const { addItem } = useCartContext();
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);

  const packSizeText =
    medicine.packSize && medicine.packSize > 0
      ? `Pack size: ${medicine.packSize} ${
          medicine.packSize === 1 ? "unit" : "capsules / tablets"
        }`
      : "Pack size: Not specified";

  const imageUrl =
    medicine.imageUrls && medicine.imageUrls.length > 0
      ? medicine.imageUrls[0]
      : null;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {/* HEADER */}
      <div className="flex gap-4">
        {/* IMAGE */}
        <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={medicine.name}
              className="h-full w-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-xs text-muted-foreground text-center px-2">
              Image not available
            </span>
          )}
        </div>

        {/* INFO */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-snug">
              {medicine.name}
            </h3>

            <button
              onClick={() => setShowDetails(!showDetails)}
              aria-label="View details"
            >
              <Info className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <p className="mt-1 text-lg font-bold">
            ₹{Number(medicine.price).toFixed(2)}
          </p>
        </div>
      </div>

      {/* DETAILS */}
      {showDetails && (
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          <div>{packSizeText}</div>

          {medicine.manufacturer && (
            <div>
              Manufacturer:{" "}
              <span className="font-medium text-foreground">
                {medicine.manufacturer}
              </span>
            </div>
          )}

          {medicine.requiresPrescription && (
            <div className="text-red-600 font-medium">
              Prescription required
            </div>
          )}
        </div>
      )}

      {/* ACTION */}
      <div className="mt-4 flex justify-end">
        <Button
          className="rounded-full px-6 text-base"
          onClick={() => addItem(medicine, 1)}
        >
          + Add
        </Button>
      </div>
    </div>
  );
}