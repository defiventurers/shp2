import { useState, useMemo } from "react";
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
     Fetch medicines
  ------------------------------ */
  const {
    data: medicines = [],
    isLoading: medicinesLoading,
  } = useQuery<MedicinesResponse>({
    queryKey: ["/api/medicines"],
    select: (res) => res.medicines,
  });

  /* -----------------------------
     Fetch categories
  ------------------------------ */
  const { data: categories = [] } = useQuery<CategoriesResponse>({
    queryKey: ["/api/categories"],
    select: (res) => res.categories,
  });

  /* -----------------------------
     Filtering logic
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

          {hasActiveFilters && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {filteredMedicines.length} results found
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 max-w-7xl mx-auto">
        {medicinesLoading ? (
          <InventorySkeleton />
        ) : filteredMedicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-8 h-8 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-1">No medicines found</h3>
            <p className="text-muted-foreground text-sm">
              No medicines match your current filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMedicines.map((medicine) => (
              <MedicineCard key={medicine.id} medicine={medicine} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
