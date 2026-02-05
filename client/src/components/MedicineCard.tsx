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
  const [open, setOpen] = useState(false);

  const packLabel = (() => {
    const size = medicine.packSize || "0";
    switch (medicine.category?.toUpperCase()) {
      case "TABLETS":
        return `Pack of ${size} tablets`;
      case "CAPSULES":
        return `Pack of ${size} capsules`;
      case "SYRUPS":
        return `Bottle of ${size} ml`;
      case "INJECTIONS":
        return `Pack of ${size} injection(s)`;
      default:
        return `Pack of ${size}`;
    }
  })();

  function handleAddToCart() {
    console.log("🛒 Add to cart:", medicine.name);
    // Cart logic will plug in here later
  }

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <h2 className="font-bold text-lg">
          {medicine.name.toUpperCase()}
        </h2>

        <button
          onClick={() => setOpen(!open)}
          className="text-blue-600 text-sm underline"
        >
          {open ? "Hide Details" : "View Details"}
        </button>
      </div>

      {/* PRICE */}
      <div className="mt-2 text-green-700 font-semibold text-lg">
        ₹{medicine.price}
      </div>

      {/* RX BADGE */}
      {medicine.requiresPrescription && (
        <Badge className="mt-2 bg-red-600">
          Prescription Required
        </Badge>
      )}

      {/* ADD TO CART */}
      <button
        onClick={handleAddToCart}
        className="mt-4 w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition"
      >
        🛒 Add to Cart
      </button>

      {/* DETAILS */}
      {open && (
        <div className="mt-4 border-t pt-4 space-y-3">
          {medicine.imageUrl && (
            <div className="w-full h-40 flex items-center justify-center bg-gray-50 rounded">
              <img
                src={medicine.imageUrl}
                alt={medicine.name}
                className="max-h-full object-contain"
              />
            </div>
          )}

          <div className="text-sm text-gray-700">
            {packLabel}
          </div>

          <div className="text-sm text-gray-600">
            Manufactured by{" "}
            <span className="font-medium">
              {medicine.manufacturer}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}