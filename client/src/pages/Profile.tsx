import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  FileText,
  Package,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

type OrderItem = {
  medicineName: string;
  quantity: number;
  price: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  items?: OrderItem[];
};

export default function Profile() {
  const { user } = useAuth();
  const { prescriptions, refreshPrescriptions } = useCartContext();
  const { toast } = useToast();

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingPrescriptionId, setEditingPrescriptionId] =
    useState<string | null>(null);
  const [newName, setNewName] = useState("");

  /* -----------------------------
     Fetch Orders (with items)
  ------------------------------ */
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders`,
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
  });

  /* -----------------------------
     Rename Prescription
  ------------------------------ */
  async function renamePrescription(id: string) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        }
      );

      if (!res.ok) throw new Error();

      await refreshPrescriptions();
      setEditingPrescriptionId(null);
      toast({ title: "Prescription renamed" });
    } catch {
      toast({
        title: "Rename failed",
        variant: "destructive",
      });
    }
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-lg font-semibold">Profile</h1>

      {/* =============================
         PRESCRIPTIONS
      ============================== */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Prescriptions</span>
        </div>

        {prescriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No prescriptions uploaded yet.
          </p>
        ) : (
          prescriptions.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between border rounded-md p-2"
            >
              <div className="flex-1">
                {editingPrescriptionId === p.id ? (
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8"
                  />
                ) : (
                  <p className="text-sm font-medium">
                    {p.extractedMedicines?.meta?.name ||
                      `Prescription – ${new Date(
                        p.createdAt
                      ).toLocaleDateString("en-GB")}`}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {p.imageUrls.length} page(s)
                </p>
              </div>

              {editingPrescriptionId === p.id ? (
                <Button
                  size="sm"
                  onClick={() => renamePrescription(p.id)}
                >
                  <Check size={14} />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingPrescriptionId(p.id);
                    setNewName(
                      p.extractedMedicines?.meta?.name || ""
                    );
                  }}
                >
                  <Pencil size={14} />
                </Button>
              )}
            </div>
          ))
        )}
      </Card>

      {/* =============================
         ORDERS (EXPANDABLE)
      ============================== */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Orders</span>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No orders placed yet.
          </p>
        ) : (
          orders.map((order) => {
            const isOpen = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="border rounded-md p-2 space-y-2"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedOrderId(isOpen ? null : order.id)
                  }
                >
                  <div>
                    <p className="text-sm font-medium">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {order.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      ₹{Number(order.total).toFixed(0)}
                    </span>
                    {isOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                </div>

                {isOpen && order.items && (
                  <div className="pt-2 space-y-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.medicineName} × {item.quantity}
                        </span>
                        <span>
                          ₹{Number(item.price).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}