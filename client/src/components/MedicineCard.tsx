import { useState } from "react";
import { Badge } from "@/components/ui/badge";

type Medicine = {
  id: string;
  name: string;
  price: string;
  requiresPrescription: boolean;
  packSize: string;
  manufacturer: string;
  imageUrl: string | null;
  category: string;
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

  /* Pack text based on category */
  const packLabel = (() => {
    const size = Number(medicine.packSize || 0);
    if (!size) return "";

    const cat = medicine.category?.toLowerCase();
    if (cat === "tablets") return `Strip of ${size} tablets`;
    if (cat === "capsules") return `Strip of ${size} capsules`;
    if (cat === "syrups") return `Bottle`;
    if (cat === "drops") return `Bottle`;
    if (cat === "injections") return `Vial`;
    return `Pack of ${size}`;
  })();

  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <h2 className="font-bold text-lg tracking-wide">
          {medicine.name}
        </h2>

        {medicine.requiresPrescription && (
          <Badge variant="destructive" className="text-xs">
            Rx
          </Badge>
        )}
      </div>

      {/* PRICE */}
      <div className="text-green-600 font-semibold mt-2">
        ₹{medicine.price}
      </div>

      {/* TOGGLE DETAILS */}
      <button
        onClick={() => setShowDetails((v) => !v)}
        className="text-blue-600 text-sm mt-2"
      >
        {showDetails ? "Hide Details" : "View Details"}
      </button>

      {/* DETAILS */}
      {showDetails && (
        <div className="mt-4 space-y-3">
          {/* IMAGE */}
          {medicine.imageUrl && (
            <div className="w-full h-40 bg-gray-50 flex items-center justify-center rounded">
              <img
                src={medicine.imageUrl}
                alt={medicine.name}
                className="max-h-full object-contain"
              />
            </div>
          )}

          {/* PACK SIZE */}
          {packLabel && (
            <div className="text-sm text-gray-700">
              {packLabel}
            </div>
          )}

          {/* MANUFACTURER */}
          <div className="text-sm text-gray-500">
            Manufactured by{" "}
            <span className="font-medium">
              {medicine.manufacturer}
            </span>
          </div>

          {/* 🛒 ADD TO CART */}
          <div className="flex justify-end items-center gap-2 pt-2">
            <button
              onClick={decrement}
              disabled={qty === 0}
              className="w-7 h-7 rounded border flex items-center justify-center disabled:opacity-40"
            >
              −
            </button>

            <span className="min-w-[20px] text-center text-sm">
              {qty}
            </span>

            <button
              onClick={increment}
              className="w-7 h-7 rounded border flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}