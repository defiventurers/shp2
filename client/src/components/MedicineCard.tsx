import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";
import type { Medicine } from "@shared/schema";

interface Props {
  medicine: Medicine;
}

export default function MedicineCard({ medicine }: Props) {
  const { addItem } = useCartContext();
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);

  const packSizeText = medicine.packSize
    ? `Pack size: ${medicine.packSize} capsules / tablets`
    : "Pack size: Not specified";

  const imageUrl =
    medicine.imageUrls && medicine.imageUrls.length > 0
      ? medicine.imageUrls[0]
      : null;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
      {/* TOP ROW */}
      <div className="flex justify-between items-start gap-3">
        {/* IMAGE PLACEHOLDER (FIXED SIZE) */}
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={medicine.name}
              className="w-full h-full object-contain rounded-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-center leading-tight">
              Image<br />not<br />available
            </span>
          )}
        </div>

        {/* MAIN INFO */}
        <div className="flex-1">
          <h3 className="font-semibold text-base leading-tight">
            {medicine.name}
          </h3>

          <p className="text-lg font-bold mt-1">
            ₹{Number(medicine.price).toFixed(2)}
          </p>

          {/* PACK SIZE — ALWAYS VISIBLE */}
          <p className="text-sm text-muted-foreground mt-1">
            {packSizeText}
          </p>
        </div>

        {/* ADD BUTTON */}
        <Button
          onClick={() => addItem(medicine, 1)}
          className="rounded-full px-5 h-10 text-base"
        >
          + Add
        </Button>
      </div>

      {/* TOGGLE TEXT (REPLACES ICON) */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="text-sm text-muted-foreground flex items-center gap-1"
      >
        {showDetails ? "▲ Hide details" : "▼ View details"}
      </button>

      {/* OPTIONAL DETAILS */}
      {showDetails && (
        <div className="pt-2 space-y-2 text-sm text-muted-foreground">
          {medicine.manufacturer && (
            <p>
              <strong>Manufacturer:</strong> {medicine.manufacturer}
            </p>
          )}

          {medicine.requiresPrescription && (
            <p className="text-red-600 font-medium">
              Prescription required
            </p>
          )}
        </div>
      )}
    </div>
  );
}