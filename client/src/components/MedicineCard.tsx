import { Badge } from "@/components/ui/badge";
import { useCartContext } from "@/context/CartContext";

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
  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
  } = useCartContext();

  const existingItem = items.find(
    (i) => i.medicine.id === medicine.id
  );

  const qty = existingItem?.quantity ?? 0;

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
    <div className="relative border rounded-xl p-4 bg-white shadow-sm">
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

      {/* DETAILS */}
      <div className="mt-3 space-y-2">
        {medicine.imageUrl && (
          <div className="w-full h-40 bg-gray-50 flex items-center justify-center rounded">
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

      {/* 🛒 ADD TO CART – CONNECTED TO CART */}
      <div className="absolute bottom-4 right-4">
        {qty === 0 ? (
          <button
            onClick={() => addItem(medicine, 1)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
          >
            <span className="text-lg leading-none">+</span>
            Add
          </button>
        ) : (
          <div className="flex items-center bg-green-600 text-white rounded-lg overflow-hidden shadow">
            <button
              onClick={() => updateQuantity(medicine.id, qty - 1)}
              className="px-3 py-2 text-lg"
            >
              −
            </button>

            <span className="px-3 text-sm font-medium">
              {qty}
            </span>

            <button
              onClick={() => updateQuantity(medicine.id, qty + 1)}
              className="px-3 py-2 text-lg"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}