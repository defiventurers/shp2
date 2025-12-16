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
  RefreshCw,
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
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageLoader } from "@/components/LoadingSpinner";
import type { Order, OrderItem, Medicine } from "@shared/schema";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

const orderStatuses = [
  { value: "pending", label: "Pending", icon: Clock },
  { value: "confirmed", label: "Confirmed", icon: Check },
  { value: "processing", label: "Processing", icon: Package },
  { value: "ready", label: "Ready", icon: Check },
  { value: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { value: "delivered", label: "Delivered", icon: Check },
  { value: "cancelled", label: "Cancelled", icon: XCircle },
];

export default function Admin() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [stockValue, setStockValue] = useState("");
  const [priceValue, setPriceValue] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You need admin access to view this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, user, authLoading, navigate, toast]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/admin/orders"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const { data: medicines = [], isLoading: medicinesLoading } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update order", description: error.message, variant: "destructive" });
    },
  });

  const updateMedicineMutation = useMutation({
    mutationFn: async ({ id, stock, price }: { id: string; stock: number; price: string }) => {
      return apiRequest("PATCH", `/api/admin/medicines/${id}`, { stock, price });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      setEditingMedicine(null);
      toast({ title: "Medicine updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update medicine", description: error.message, variant: "destructive" });
    },
  });

  const lowStockMedicines = medicines.filter((m) => m.stock <= 10);
  const pendingOrders = orders.filter((o) => o.status === "pending");

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditMedicine = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setStockValue(medicine.stock.toString());
    setPriceValue(medicine.price);
  };

  const handleSaveMedicine = () => {
    if (!editingMedicine) return;
    updateMedicineMutation.mutate({
      id: editingMedicine.id,
      stock: parseInt(stockValue) || 0,
      price: priceValue,
    });
  };

  if (authLoading || ordersLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 py-4 max-w-4xl mx-auto">
        <h1 className="font-semibold text-lg mb-4">Admin Dashboard</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">{pendingOrders.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Package className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">{medicines.length}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">{lowStockMedicines.length}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="w-full">
            <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No orders yet</p>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="p-4" data-testid={`admin-order-${order.id}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">#{order.orderNumber}</p>
                        <Badge variant="secondary" className="text-xs">
                          {order.deliveryType === "pickup" ? "Pickup" : "Delivery"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.createdAt!).toLocaleString("en-IN")}
                      </p>

                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.medicineName} x{item.quantity}</span>
                            <span>₹{parseFloat(item.total).toFixed(0)}</span>
                          </div>
                        ))}
                        <div className="border-t mt-1 pt-1 font-medium flex justify-between">
                          <span>Total</span>
                          <span>₹{parseFloat(order.total).toFixed(0)}</span>
                        </div>
                      </div>

                      {order.deliveryType === "delivery" && order.deliveryAddress && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <strong>Address:</strong> {order.deliveryAddress}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:w-40">
                      <Select
                        value={order.status || "pending"}
                        onValueChange={(status) =>
                          updateOrderMutation.mutate({ orderId: order.id, status })
                        }
                      >
                        <SelectTrigger data-testid={`select-status-${order.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="inventory" className="mt-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search medicines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {lowStockMedicines.length > 0 && (
              <Card className="p-3 mb-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="font-medium text-sm text-amber-800 dark:text-amber-200">
                    Low Stock Alert
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lowStockMedicines.slice(0, 5).map((m) => (
                    <Badge key={m.id} variant="secondary" className="text-xs">
                      {m.name} ({m.stock})
                    </Badge>
                  ))}
                  {lowStockMedicines.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{lowStockMedicines.length - 5} more
                    </Badge>
                  )}
                </div>
              </Card>
            )}

            <div className="space-y-2">
              {medicinesLoading ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">Loading...</p>
                </Card>
              ) : (
                filteredMedicines.map((medicine) => (
                  <Card
                    key={medicine.id}
                    className="p-3"
                    data-testid={`admin-medicine-${medicine.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{medicine.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {medicine.dosage} • ₹{parseFloat(medicine.price).toFixed(0)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={medicine.stock <= 10 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          Stock: {medicine.stock}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditMedicine(medicine)}
                          data-testid={`button-edit-${medicine.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editingMedicine} onOpenChange={() => setEditingMedicine(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
          </DialogHeader>
          {editingMedicine && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{editingMedicine.name}</p>
                <p className="text-sm text-muted-foreground">{editingMedicine.dosage}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  value={stockValue}
                  onChange={(e) => setStockValue(e.target.value)}
                  data-testid="input-edit-stock"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="text"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  data-testid="input-edit-price"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSaveMedicine}
                disabled={updateMedicineMutation.isPending}
                data-testid="button-save-medicine"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
