import { useState } from "react";
import { Badge } from "@/components/ui/badge";

type Medicine = {
  id: string;
  name: string;
  price: string;
  requiresPrescription: boolean;
  packSize: number;
  manufacturer: string;
  imageUrl: string | null;
};

export default function MedicineCard({
  medicine,
}: {
  medicine: Medicine;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [qty, setQty] = useState(0);

  const increment = () => setQty((q) => q + 1);
  const decrement = () => setQty((q) => Math.max(0, q - 1));

  /* ✅ PACK SIZE — CATEGORY INDEPENDENT */
  const packLabel =
    medicine.packSize && medicine.packSize > 0
      ? `Pack size: ${medicine.packSize}`
      : null;

  return (
    <div className="relative border rounded-xl p-4 bg-white shadow-sm">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-bold text-base leading-tight">
          {medicine.name}
          {medicine.requiresPrescription && (
            <span className="ml-2 text-red-600 font-semibold text-sm">
              Rx
            </span>
          )}
        </h2>
      </div>

      {/* PRICE */}
      <div className="text-green-600 font-semibold mt-1">
        ₹{medicine.price}
      </div>

      {/* VIEW DETAILS */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="text-blue-600 text-sm mt-1 flex items-center gap-1"
      >
        {showDetails ? "▼ Hide Details" : "▶ View Details"}
      </button>

      {/* DETAILS */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          {medicine.imageUrl && (
            <div className="w-full h-32 bg-gray-50 flex items-center justify-center rounded">
              <img
                src={medicine.imageUrl}
                alt={medicine.name}
                className="max-h-full object-contain"
              />
            </div>
          )}

          {packLabel && (
            <div className="text-sm text-gray-700">
              {packLabel}
            </div>
          )}

          <div className="text-sm text-gray-500">
            Manufactured by{" "}
            <span className="font-medium">
              {medicine.manufacturer}
            </span>
          </div>
        </div>
      )}

      {/* ADD TO CART */}
      <div className="absolute bottom-4 right-4">
        {qty === 0 ? (
          <button
            onClick={increment}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
          >
            <span className="text-lg leading-none">+</span>
            Add
          </button>
        ) : (
          <div className="flex items-center bg-green-600 text-white rounded-lg overflow-hidden shadow">
            <button onClick={decrement} className="px-3 py-2 text-lg">
              −
            </button>
            <span className="px-3 text-sm font-medium">{qty}</span>
            <button onClick={increment} className="px-3 py-2 text-lg">
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}