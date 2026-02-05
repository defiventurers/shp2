import { useState } from "react";

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

function packText(category: string, packSize: string) {
  const qty = Number(packSize || 0);

  switch (category) {
    case "TABLETS":
      return `Strip of ${qty} tablets`;
    case "CAPSULES":
      return `Strip of ${qty} capsules`;
    case "SYRUPS":
      return `Bottle (${qty} ml)`;
    case "INJECTIONS":
      return `${qty} injection vial(s)`;
    case "TOPICALS":
      return `${qty} g topical`;
    case "DROPS":
      return `Bottle (${qty} ml)`;
    case "Powders":
      return `${qty} g powder`;
    case "Mouthwash":
      return `Bottle (${qty} ml)`;
    case "Inhalers":
      return `${qty} inhaler unit(s)`;
    case "Devices":
      return `Medical device`;
    case "Scrubs":
      return `${qty} ml scrub`;
    case "Solutions":
      return `${qty} ml solution`;
    default:
      return `Pack of ${qty}`;
  }
}

export default function MedicineCard({ medicine }: { medicine: Medicine }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white">
      {/* MAIN TILE */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-bold text-lg tracking-wide">
            {medicine.name}
          </h2>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-green-700 font-semibold">
              ₹{medicine.price}
            </span>

            {medicine.requiresPrescription && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                Rx Required
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="text-sm text-blue-600 hover:underline"
        >
          {open ? "Hide Details" : "View Details"}
        </button>
      </div>

      {/* DROPDOWN DETAILS */}
      {open && (
        <div className="mt-4 border-t pt-4 space-y-3">
          {/* IMAGE */}
          {medicine.imageUrl && (
            <div className="w-full h-52 flex justify-center items-center bg-gray-50 rounded">
              <img
                src={medicine.imageUrl}
                alt={medicine.name}
                className="max-h-full object-contain"
              />
            </div>
          )}

          {/* PACK SIZE */}
          <div className="text-sm text-gray-700">
            {packText(medicine.category, medicine.packSize)}
          </div>

          {/* MANUFACTURER */}
          <div className="text-sm text-gray-500">
            Manufactured by <span className="font-medium">{medicine.manufacturer}</span>
          </div>
        </div>
      )}
    </div>
  );
}