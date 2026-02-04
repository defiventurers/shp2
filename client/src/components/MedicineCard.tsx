import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Medicine } from "@shared/schema";

interface Props {
  medicine: Medicine;
}

export function MedicineCard({ medicine }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  // ✅ Correct image source (array from backend)
  const imageUrl =
    Array.isArray(medicine.imageUrls) && medicine.imageUrls.length > 0
      ? medicine.imageUrls[0]
      : null;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {/* =======================
          MAIN CARD (NO IMAGE HERE)
      ======================== */}
      <div className="flex items-start justify-between gap-3">
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

        <Button className="h-9 px-4 shrink-0">+ Add</Button>
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

          {/* ✅ SINGLE, CONSTRAINED IMAGE TILE */}
          <div className="flex justify-center">
            <div className="h-40 w-40 rounded-md border bg-white flex items-center justify-center overflow-hidden">
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