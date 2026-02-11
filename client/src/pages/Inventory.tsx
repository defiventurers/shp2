import { useEffect, useRef, useState } from "react";
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
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const latestRequestRef = useRef(0);

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
    const category = params.get("category");
    if (qs) setSearch(qs);
    if (category) setSelectedCategoryName(category.toUpperCase());
  }, [location]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search]);

  async function loadMedicines(targetPage: number, reset = false) {
    const requestId = Date.now() + Math.random();
    latestRequestRef.current = requestId;

    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("limit", String(PAGE_SIZE));

      if (debouncedSearch) params.set("q", debouncedSearch);
      if (selectedCategoryName) params.set("category", selectedCategoryName);

      const medRes = await fetch(`${API_BASE}/api/medicines?${params.toString()}`);
      if (!medRes.ok) throw new Error("Medicines API failed");

      const medJson = await medRes.json();

      if (latestRequestRef.current !== requestId) {
        return;
      }

      setTotalPages(medJson.totalPages || 1);
      setTotalMedicines(medJson.total || 0);

      if (reset) {
        setMedicines(medJson.medicines || []);
      } else {
        setMedicines((prev) => {
          const incoming: Medicine[] = medJson.medicines || [];
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueIncoming = incoming.filter((m) => !existingIds.has(m.id));
          return [...prev, ...uniqueIncoming];
        });
      }
    } catch (err) {
      console.error("❌ Inventory load failed:", err);
      setError("Failed to load medicines");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    setPage(1);
    loadMedicines(1, true);
  }, [debouncedSearch, selectedCategoryName]);

  useEffect(() => {
    if (page === 1) return;
    loadMedicines(page, false);
  }, [page]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loadingMore && !loading && page < totalPages) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadingMore, loading, page, totalPages]);

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Medicines</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {totalMedicines > 0
          ? `${totalMedicines.toLocaleString()} medicines available`
          : "Search medicines by name or manufacturer"}
      </p>

      <Card className="p-3 mb-4 border-green-200 bg-green-50">
        <p className="text-xs text-muted-foreground">
          Fast search on our full catalog. Keep scrolling to load more medicines instantly.
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

          <div ref={loadMoreRef} className="h-10 mt-6 flex items-center justify-center">
            {loadingMore ? (
              <span className="text-xs text-muted-foreground">Loading more medicines...</span>
            ) : page >= totalPages ? (
              <span className="text-xs text-muted-foreground">You have reached the end</span>
            ) : (
              <button
                className="px-4 py-2 rounded border text-sm"
                onClick={() => setPage((p) => p + 1)}
              >
                Load More
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
