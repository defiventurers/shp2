import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import MedicineCard from "@/components/MedicineCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Medicine = {
  id: string;
  name: string;
  price: string;
  requiresPrescription: boolean;
  packSize: string;
  manufacturer: string;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName?: string;
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
  const [location] = useLocation();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const catRes = await fetch(`${API_BASE}/api/categories`);
        if (!catRes.ok) return;

        const catJson = await catRes.json();
        if (Array.isArray(catJson.categories)) {
          setCategories(catJson.categories);
        }
      } catch {
        setCategories([]);
      }
    }

    loadCategories();
  }, []);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qs = params.get("search");
    if (qs) setSearch(qs);
  }, [location]);

  useEffect(() => {
    let ignore = false;

    async function loadMedicines() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));

        if (search.trim()) params.set("q", search.trim());
        if (selectedCategoryName) params.set("category", selectedCategoryName);

        const medRes = await fetch(`${API_BASE}/api/medicines?${params.toString()}`);
        if (!medRes.ok) throw new Error("Medicines API failed");

        const medJson = await medRes.json();
        if (ignore) return;

        setMedicines(medJson.medicines || []);
        setTotalPages(medJson.totalPages || 1);
        setTotalMedicines(medJson.total || 0);
      } catch (err) {
        if (!ignore) {
          console.error("❌ Inventory load failed:", err);
          setError("Failed to load medicines");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadMedicines();

    return () => {
      ignore = true;
    };
  }, [page, search, selectedCategoryName]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategoryName]);

  const title = useMemo(() => {
    if (selectedCategoryName) return `Medicines • ${selectedCategoryName}`;
    return "Medicines";
  }, [selectedCategoryName]);

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {totalMedicines > 0
          ? `${totalMedicines.toLocaleString()} medicines found`
          : "Search medicines by name or manufacturer"}
      </p>

      <Card className="p-3 mb-4 border-green-200 bg-green-50">
        <p className="text-xs text-muted-foreground">
          Verified inventory with fast search. Prescription medicines are clearly marked with Rx.
        </p>
      </Card>

      <input
        type="text"
        placeholder="Search medicine or manufacturer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring"
      />

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <button
            onClick={() => setSelectedCategoryName(null)}
            className={`px-3 py-1 rounded-full text-sm border whitespace-nowrap ${
              selectedCategoryName === null ? "bg-primary text-white" : "bg-white"
            }`}
          >
            ALL
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryName(cat.name)}
              className={`px-3 py-1 rounded-full text-sm border whitespace-nowrap ${
                selectedCategoryName === cat.name ? "bg-primary text-white" : "bg-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : medicines.length === 0 ? (
        <div className="text-gray-500 text-center">No medicines found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicines.map((medicine) => (
              <MedicineCard key={medicine.id} medicine={medicine} />
            ))}
          </div>

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
