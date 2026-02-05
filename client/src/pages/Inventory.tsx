import { useEffect, useState } from "react";
import MedicineCard from "@/components/MedicineCard";

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

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://sacredheartpharma-backend.onrender.com";

export default function Inventory() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMedicines() {
      try {
        const res = await fetch(`${API_BASE}/api/medicines`);

        if (!res.ok) {
          throw new Error(`API failed: ${res.status}`);
        }

        const data = await res.json();
        setMedicines(data.medicines || []);
      } catch (err) {
        console.error("❌ Inventory fetch failed:", err);
        setError("Failed to load medicines");
      } finally {
        setLoading(false);
      }
    }

    loadMedicines();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading medicines…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Medicines</h1>

      {medicines.length === 0 ? (
        <div className="text-gray-500 text-center">
          No medicines found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
            />
          ))}
        </div>
      )}
    </div>
  );
}