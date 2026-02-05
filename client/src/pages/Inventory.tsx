import { useEffect, useMemo, useState } from "react";
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

const PAGE_SIZE = 24;

export default function Inventory() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadMedicines() {
      try {
        const res = await fetch(`${API_BASE}/api/medicines`);

        if (!res.ok) {
          throw new Error(`API failed: ${res.status}`);
        }

        const data = await res.json();
        setMedicines(data.medicines || []);
        setPage(1);
      } catch (err) {
        console.error("❌ Inventory fetch failed:", err);
        setError("Failed to load medicines");
      } finally {
        setLoading(false);
      }
    }

    loadMedicines();
  }, []);

  /* -----------------------------
     SEARCH FILTER
  ------------------------------ */
  const filteredMedicines = useMemo(() => {
    if (!search.trim()) return medicines;

    const q = search.toLowerCase();
    return medicines.filter((m) =>
      m.name.toLowerCase().includes(q)
    );
  }, [medicines, search]);

  /* -----------------------------
     PAGINATION
  ------------------------------ */
  const totalPages = Math.ceil(filteredMedicines.length / PAGE_SIZE);

  const paginatedMedicines = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredMedicines.slice(start, end);
  }, [filteredMedicines, page]);

  /* Reset page when search changes */
  useEffect(() => {
    setPage(1);
  }, [search]);

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
      <h1 className="text-2xl font-bold mb-4">Medicines</h1>

      {/* 🔍 SEARCH */}
      <input
        type="text"
        placeholder="Search medicine name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-6 px-4 py-2 border rounded-md focus:outline-none focus:ring"
      />

      {filteredMedicines.length === 0 ? (
        <div className="text-gray-500 text-center">
          No medicines found
        </div>
      ) : (
        <>
          {/* MEDICINE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedMedicines.map((medicine) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
              />
            ))}
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded border disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}