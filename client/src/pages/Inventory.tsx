import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MedicineCard } from "@/components/MedicineCard";
import { InventorySkeleton } from "@/components/LoadingSpinner";
import type { Medicine, Category } from "@shared/schema";

/* -----------------------------
   Debounce hook
------------------------------ */
function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/* -----------------------------
   API response
------------------------------ */
type MedicinesResponse = {
  success: boolean;
  medicines: Medicine[];
  page: number;
  hasMore: boolean;
};

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);

  const debouncedSearch = useDebounce(searchQuery);

  /* -----------------------------
     Infinite medicines query
  ------------------------------ */
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<MedicinesResponse>({
    queryKey: [
      "medicines",
      debouncedSearch,
      selectedCategory,
      showOnlyInStock,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: "50",
        search: debouncedSearch,
      });

      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (showOnlyInStock) params.append("inStock", "true");

      const res = await fetch(`/api/medicines?${params}`);
      return res.json();
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    keepPreviousData: true,
  });

  const medicines = data?.pages.flatMap((p) => p.medicines) ?? [];

  /* -----------------------------
     Categories
  ------------------------------ */
  const { data: categories = [] } = useInfiniteQuery<any>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
    select: (res) => res.pages?.[0]?.categories ?? [],
  });

  /* -----------------------------
     Infinite scroll observer
  ------------------------------ */
  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 400 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /* -----------------------------
     Render
  ------------------------------ */
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-background border-b">
        <div className="px-4 py-3 max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
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
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={showOnlyInStock ? "default" : "outline"}
                onClick={() => setShowOnlyInStock(!showOnlyInStock)}
              >
                <Filter className="w-3 h-3 mr-1" />
                In Stock
              </Button>

              {categories.map((c: Category) => (
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
          </ScrollArea>
        </div>
      </div>

      {/* Inventory */}
      <div className="px-4 py-4 max-w-7xl mx-auto">
        {isLoading && <InventorySkeleton />}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {medicines.map((medicine) => (
            <MedicineCard key={medicine.id} medicine={medicine} />
          ))}
        </div>

        {isFetchingNextPage && (
          <div className="mt-6">
            <InventorySkeleton />
          </div>
        )}

        {!hasNextPage && medicines.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            You’ve reached the end of inventory
          </p>
        )}
      </div>
    </div>
  );
}