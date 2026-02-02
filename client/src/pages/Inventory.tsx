import { useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MedicineCard } from "@/components/MedicineCard";
import { InventorySkeleton } from "@/components/LoadingSpinner";
import type { Medicine, Category } from "@shared/schema";

/* -----------------------------
   API response
------------------------------ */
type MedicinesResponse = {
  success: boolean;
  medicines: Medicine[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

type CategoriesResponse = {
  success: boolean;
  categories: Category[];
};

const PAGE_SIZE = 50;

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);

  /* -----------------------------
     Medicines (PAGINATED)
  ------------------------------ */
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<MedicinesResponse>({
    queryKey: ["medicines"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await fetch(
        `/api/medicines?page=${pageParam}&limit=${PAGE_SIZE}`
      );
      return res.json();
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });

  const medicines = useMemo(
    () => data?.pages.flatMap((p) => p.medicines) ?? [],
    [data]
  );

  /* -----------------------------
     Categories
  ------------------------------ */
  const { data: categories = [] } = useInfiniteQuery<CategoriesResponse>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
    select: (res) => res.pages?.[0]?.categories ?? [],
    initialPageParam: 1,
  });

  /* -----------------------------
     Filtering
  ------------------------------ */
  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      const matchesSearch =
        searchQuery === "" ||
        medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medicine.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medicine.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || medicine.categoryId === selectedCategory;

      const matchesStock = !showOnlyInStock || medicine.stock > 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [medicines, searchQuery, selectedCategory, showOnlyInStock]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setShowOnlyInStock(false);
  };

  const hasActiveFilters =
    Boolean(searchQuery) || Boolean(selectedCategory) || showOnlyInStock;

  /* -----------------------------
     Render
  ------------------------------ */
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-14 z-30 bg-background border-b">
        <div className="px-4 py-3 max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search medicines, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <ScrollArea className="mt-3">
            <div className="flex gap-2 pb-2">
              <Button
                size="sm"
                variant={showOnlyInStock ? "default" : "outline"}
                onClick={() => setShowOnlyInStock(!showOnlyInStock)}
              >
                <Filter className="w-3 h-3 mr-1" />
                In stock
              </Button>

              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "secondary"}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat.id ? null : cat.id
                    )
                  }
                  className="cursor-pointer"
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {hasActiveFilters && (
            <div className="flex justify-between mt-2 text-xs">
              <span>{filteredMedicines.length} results</span>
              <button onClick={clearFilters}>Clear</button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 max-w-7xl mx-auto">
        {isLoading ? (
          <InventorySkeleton />
        ) : filteredMedicines.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            No medicines found
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMedicines.map((medicine) => (
                <MedicineCard key={medicine.id} medicine={medicine} />
              ))}
            </div>

            {hasNextPage && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}