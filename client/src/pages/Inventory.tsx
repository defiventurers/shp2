import { useState, useMemo, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MedicineCard } from "@/components/MedicineCard";
import { InventorySkeleton } from "@/components/LoadingSpinner";
import type { Medicine, Category } from "@shared/schema";

const API_URL = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 50;

type MedicinesResponse = {
  success: boolean;
  medicines: Medicine[];
};

type CategoriesResponse = {
  success: boolean;
  categories: Category[];
};

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);

  /* -----------------------------
     PAGINATED MEDICINES
  ------------------------------ */
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<MedicinesResponse>({
    queryKey: ["medicines"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `${API_URL}/api/medicines?page=${pageParam}&limit=${PAGE_SIZE}`
      );
      if (!res.ok) throw new Error("Failed to fetch medicines");
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.medicines.length < PAGE_SIZE
        ? undefined
        : allPages.length + 1,
  });

  const medicines = data?.pages.flatMap((p) => p.medicines) ?? [];

  /* -----------------------------
     CATEGORIES
  ------------------------------ */
  const { data: categories = [] } = useQuery<CategoriesResponse>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    select: (res) => res.categories,
  });

  /* -----------------------------
     FILTERING
  ------------------------------ */
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchesSearch =
        !searchQuery ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || m.categoryId === selectedCategory;

      const matchesStock = !showOnlyInStock || m.stock > 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [medicines, searchQuery, selectedCategory, showOnlyInStock]);

  /* -----------------------------
     AUTO LOAD MORE
  ------------------------------ */
  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  /* -----------------------------
     ERROR STATE
  ------------------------------ */
  if (isError) {
    console.error(error);
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load medicines. Please refresh.
      </div>
    );
  }

  /* -----------------------------
     UI
  ------------------------------ */
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-14 z-30 bg-background border-b">
        <div className="px-4 py-3 max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
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

              {categories.map((c) => (
                <Badge
                  key={c.id}
                  variant={selectedCategory === c.id ? "default" : "secondary"}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === c.id ? null : c.id
                    )
                  }
                  className="cursor-pointer"
                >
                  {c.name}
                </Badge>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      <div className="px-4 py-4 max-w-7xl mx-auto">
        {isLoading ? (
          <InventorySkeleton />
        ) : filteredMedicines.length === 0 ? (
          <p className="text-center py-16 text-muted-foreground">
            No medicines found
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMedicines.map((m) => (
                <MedicineCard key={m.id} medicine={m} />
              ))}
            </div>

            {isFetchingNextPage && (
              <p className="text-center py-6 text-sm text-muted-foreground">
                Loading more medicines…
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}