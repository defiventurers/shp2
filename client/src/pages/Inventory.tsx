import { useState, useMemo, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MedicineCard } from "@/components/MedicineCard";
import { InventorySkeleton } from "@/components/LoadingSpinner";
import type { Medicine, Category } from "@shared/schema";

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
     PAGINATED MEDICINES FETCH
  ------------------------------ */
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<MedicinesResponse>({
    queryKey: ["medicines"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/medicines?page=${pageParam}&limit=${PAGE_SIZE}`
      );
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.medicines.length < PAGE_SIZE) return undefined;
      return allPages.length + 1;
    },
  });

  const medicines = data?.pages.flatMap((p) => p.medicines) ?? [];

  /* -----------------------------
     FETCH CATEGORIES
  ------------------------------ */
  const { data: categories = [] } = useQuery<CategoriesResponse>({
    queryKey: ["/api/categories"],
    select: (res) => res.categories,
  });

  /* -----------------------------
     FILTERING
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

  /* -----------------------------
     AUTO LOAD MORE ON SCROLL
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
     UI
  ------------------------------ */
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-14 z-30 bg-background border-b border-border">
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

          <ScrollArea className="w-full whitespace-nowrap mt-3">
            <div className="flex gap-2 pb-2">
              <Button
                variant={showOnlyInStock ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyInStock(!showOnlyInStock)}
              >
                <Filter className="w-3 h-3 mr-1" />
                In Stock
              </Button>

              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "secondary"
                  }
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )
                  }
                >
                  {category.name}
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
              {filteredMedicines.map((medicine) => (
                <MedicineCard key={medicine.id} medicine={medicine} />
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