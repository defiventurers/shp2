import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Medicine } from "@shared/schema";

interface Props {
  medicine: Medicine;
}

export function MedicineCard({ medicine }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const imageUrl =
    medicine.imageUrls && medicine.imageUrls.length > 0
      ? medicine.imageUrls[0]
      : null;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {/* =======================
          TOP ROW
      ======================== */}
      <div className="flex items-start gap-4">
        {/* Image placeholder (fixed size, always reserved) */}
        <div className="h-16 w-16 flex-shrink-0 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
          {imageUrl ? "Image" : "Image not available"}
        </div>

        {/* Main info */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold leading-snug">
            {medicine.name}
          </h3>

          <p className="mt-1 text-lg font-bold">
            ₹{Number(medicine.price).toFixed(2)}
          </p>

          {medicine.packSize && (
            <p className="mt-1 text-sm text-muted-foreground">
              Pack size: {medicine.packSize} capsules / tablets
            </p>
          )}
        </div>

        {/* Add button */}
        <Button className="ml-auto h-9 px-4">+ Add</Button>
      </div>

      {/* =======================
          VIEW DETAILS TOGGLE
      ======================== */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="mt-3 text-sm text-muted-foreground"
      >
        {showDetails ? "▲ View details" : "▼ View details"}
      </button>

      {/* =======================
          DETAILS SECTION
      ======================== */}
      {showDetails && (
        <div className="mt-3 rounded-lg bg-muted/40 p-3">
          {/* Manufacturer */}
          {medicine.manufacturer && (
            <p className="mb-3 text-sm">
              <span className="font-medium">Manufacturer:</span>{" "}
              {medicine.manufacturer}
            </p>
          )}

          {/* Image container — THIS IS THE KEY FIX */}
          <div className="w-full flex justify-center">
            <div className="h-40 w-40 overflow-hidden rounded-md bg-white border flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={medicine.name}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-xs text-muted-foreground">
                  No image available
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}