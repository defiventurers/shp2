import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  Check,
  Clock,
  Truck,
  XCircle,
  Search,
  Edit,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/LoadingSpinner";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import type { Order, OrderItem, Medicine } from "@shared/schema";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

export default function Admin() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [stockValue, setStockValue] = useState("");
  const [priceValue, setPriceValue] = useState("");

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [loading, isAuthenticated, user, navigate, toast]);

  const { data: orders = [], isLoading: ordersLoading } =
    useQuery<OrderWithItems[]>({
      queryKey: ["/api/admin/orders"],
      enabled: isAuthenticated && !!user?.isAdmin,
    });

  const { data: medicines = [], isLoading: medicinesLoading } =
    useQuery<Medicine[]>({
      queryKey: ["/api/medicines"],
      enabled: isAuthenticated && !!user?.isAdmin,
    });

  const updateMedicineMutation = useMutation({
    mutationFn: async ({
      id,
      stock,
      price,
    }: {
      id: string;
      stock: number;
      price: string;
    }) => apiRequest("PATCH", `/api/admin/medicines/${id}`, { stock, price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      setEditingMedicine(null);
      toast({ title: "Medicine updated" });
    },
  });

  if (loading || ordersLoading || medicinesLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 py-4 max-w-4xl mx-auto">
        <h1 className="font-semibold text-lg mb-4">Admin Dashboard</h1>

        <Tabs defaultValue="orders">
          <TabsList className="w-full">
            <TabsTrigger value="orders" className="flex-1">
              Orders
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1">
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-4">
            <Input
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="space-y-2 mt-3">
              {medicines
                .filter((m) =>
                  m.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((medicine) => (
                  <Card key={medicine.id} className="p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">
                          {medicine.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ₹{medicine.price} • Stock {medicine.stock}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingMedicine(medicine);
                          setStockValue(String(medicine.stock));
                          setPriceValue(medicine.price);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={!!editingMedicine}
        onOpenChange={() => setEditingMedicine(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
          </DialogHeader>

          {editingMedicine && (
            <div className="space-y-3">
              <Label>Stock</Label>
              <Input
                type="number"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
              />

              <Label>Price</Label>
              <Input
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
              />

              <Button
                onClick={() =>
                  updateMedicineMutation.mutate({
                    id: editingMedicine.id,
                    stock: Number(stockValue),
                    price: priceValue,
                  })
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}