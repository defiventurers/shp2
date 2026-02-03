import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MedicineCard } from "@/components/MedicineCard";
import { InventorySkeleton } from "@/components/LoadingSpinner";
import type { Medicine, Category } from "@shared/schema";

/* -----------------------------
   API response shapes
------------------------------ */
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
     Fetch medicines (SERVER SEARCH)
  ------------------------------ */
  const {
    data: medicines = [],
    isLoading: medicinesLoading,
  } = useQuery<MedicinesResponse>({
    queryKey: ["medicines", searchQuery, selectedCategory, showOnlyInStock],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        search: searchQuery,
      });

      if (selectedCategory) {
        params.append("categoryId", selectedCategory);
      }

      if (showOnlyInStock) {
        params.append("inStock", "true");
      }

      const res = await fetch(`/api/medicines?${params.toString()}`);
      return res.json();
    },
    select: (res) => res.medicines,
    keepPreviousData: true,
  });

  /* -----------------------------
     Fetch categories
  ------------------------------ */
  const { data: categories = [] } = useQuery<CategoriesResponse>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
    select: (res) => res.categories,
  });

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
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky search header */}
      <div className="sticky top-14 z-30 bg-background border-b">
        <div className="px-4 py-3 max-w-7xl mx-auto">
          {/* Search */}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* UX hint */}
          <p className="text-xs text-muted-foreground mt-1">
            Searching across entire inventory
          </p>

          {/* Filters */}
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

          {hasActiveFilters && (
            <div className="flex justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Showing results
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Inventory list */}
      <div className="px-4 py-4 max-w-7xl mx-auto">
        {medicinesLoading ? (
          <InventorySkeleton />
        ) : medicines.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Search className="w-8 h-8 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">No medicines found</h3>
            <p className="text-muted-foreground text-sm">
              Try a different search or clear filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {medicines.map((medicine) => (
              <MedicineCard key={medicine.id} medicine={medicine} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}