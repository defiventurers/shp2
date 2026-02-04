import React from "react";

export type Medicine = {
  id: string;
  name: string;
  price: number | null;
  quantity: number | null; // units per strip (NOT stock)
  isPrescriptionRequired: boolean;
  manufacturer?: string | null;
  imageUrl?: string | null;
};

type Props = {
  medicine: Medicine;
  onAddToCart: (medicine: Medicine) => void;
};

const MedicineCard: React.FC<Props> = ({ medicine, onAddToCart }) => {
  const {
    name,
    price,
    quantity,
    isPrescriptionRequired,
    manufacturer,
    imageUrl,
  } = medicine;

  return (
    <div className="w-full rounded-xl border bg-white p-4 shadow-sm">
      {/* MAIN ROW */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* NAME */}
          <h3 className="text-[15px] font-semibold leading-snug">
            {name.toUpperCase()}
          </h3>

          {/* PRICE */}
          {price !== null && (
            <div className="mt-1 text-lg font-bold text-gray-900">
              ₹{price}
            </div>
          )}

          {/* QUANTITY (UNITS PER STRIP) */}
          {quantity !== null && quantity > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              {quantity} tabs / strip
            </div>
          )}

          {/* RX BADGE */}
          {isPrescriptionRequired && (
            <div className="mt-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              Prescription Required
            </div>
          )}
        </div>

        {/* ADD BUTTON (ALWAYS ENABLED) */}
        <button
          onClick={() => onAddToCart(medicine)}
          className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white active:scale-95"
        >
          Add
        </button>
      </div>

      {/* OPTIONAL DETAILS */}
      {(manufacturer || imageUrl) && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-gray-500">
            View details
          </summary>

          {manufacturer && (
            <div className="mt-2 text-sm text-gray-700">
              <span className="font-semibold">Manufacturer:</span>{" "}
              {manufacturer}
            </div>
          )}

          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              className="mt-2 h-24 w-24 rounded object-contain"
            />
          )}
        </details>
      )}
    </div>
  );
};

export { MedicineCard };