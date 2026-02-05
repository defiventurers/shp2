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
  categoryId: string | null;
};

type Category = {
  id: string;
  name: string;
};

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://sacredheartpharma-backend.onrender.com";

const PAGE_SIZE = 24;

export default function Inventory() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    async function loadData() {
      try {
        const [medRes, catRes] = await Promise.all([
          fetch(`${API_BASE}/api/medicines`),
          fetch(`${API_BASE}/api/categories`),
        ]);

        if (!medRes.ok || !catRes.ok) {
          throw new Error("API failed");
        }

        const medData = await medRes.json();
        const catData = await catRes.json();

        setMedicines(medData.medicines || []);
        setCategories(catData || []);
        setPage(1);
      } catch (err) {
        console.error("❌ Inventory load failed:", err);
        setError("Failed to load medicines");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /* ---------------- FILTERING ---------------- */
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchesSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.manufacturer.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        !selectedCategoryId || m.categoryId === selectedCategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [medicines, search, selectedCategoryId]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filteredMedicines.length / PAGE_SIZE);

  const paginatedMedicines = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMedicines.slice(start, start + PAGE_SIZE);
  }, [filteredMedicines, page]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategoryId]);

  /* ---------------- STATES ---------------- */
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading medicines…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">{error}</div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Medicines</h1>

      {/* 🔍 SEARCH */}
      <input
        type="text"
        placeholder="Search medicine or manufacturer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring"
      />

      {/* 🧩 CATEGORY FILTER */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`px-3 py-1 rounded-full text-sm border whitespace-nowrap ${
            selectedCategoryId === null
              ? "bg-primary text-white"
              : "bg-white"
          }`}
        >
          ALL
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-3 py-1 rounded-full text-sm border whitespace-nowrap ${
              selectedCategoryId === cat.id
                ? "bg-primary text-white"
                : "bg-white"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* MEDICINE GRID */}
      {paginatedMedicines.length === 0 ? (
        <div className="text-gray-500 text-center">
          No medicines found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedMedicines.map((medicine) => (
              <MedicineCard key={medicine.id} medicine={medicine} />
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