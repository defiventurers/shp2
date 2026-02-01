import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
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
  total: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  items: OrderItem[];
};

export default function Profile() {
  const { user } = useAuth();
  const { prescriptions, refreshPrescriptions } = useCartContext();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  /* -----------------------------
     Fetch Orders (WITH ITEMS)
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

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  /* -----------------------------
     Actions
  ------------------------------ */
  async function renamePrescription(id: string) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: newName }),
        }
      );

      if (!res.ok) throw new Error();

      toast({ title: "Prescription renamed" });
      setEditingId(null);
      setNewName("");
      await refreshPrescriptions();
    } catch {
      toast({
        title: "Rename failed",
        variant: "destructive",
      });
    }
  }

  async function deletePrescription(id: string) {
    if (!confirm("Delete this prescription?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/prescriptions/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error();

      toast({ title: "Prescription deleted" });
      await refreshPrescriptions();
    } catch {
      toast({
        title: "Delete failed",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-lg font-semibold">Profile</h1>

      {/* =============================
         USER INFO
      ============================== */}
      <Card className="p-4 space-y-2">
        <p className="text-sm">
          <strong>Name:</strong> {user.name}
        </p>
        <p className="text-sm">
          <strong>Email:</strong> {user.email}
        </p>
      </Card>

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
          prescriptions.map((p) => {
            const displayName =
              `${user.name || "Prescription"} – ${new Date(
                p.createdAt
              ).toLocaleDateString("en-GB")}`;

            return (
              <div
                key={p.id}
                className="border rounded-md p-3 space-y-2"
              >
                {editingId === p.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      onClick={() => renamePrescription(p.id)}
                    >
                      <Check size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(null);
                        setNewName("");
                      }}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.imageUrls.length} page(s)
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(p.id);
                          setNewName(displayName);
                        }}
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deletePrescription(p.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 overflow-x-auto">
                  {p.imageUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* =============================
         ORDERS (EXPANDABLE)
      ============================== */}
      <Card className="p-4 space-y-3">
        <span className="font-medium">Orders</span>

        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No orders placed yet.
          </p>
        ) : (
          orders.map((o) => {
            const expanded = expandedOrderId === o.id;

            return (
              <div
                key={o.id}
                className="border rounded-md p-3 space-y-2"
              >
                <button
                  className="flex items-center justify-between w-full"
                  onClick={() =>
                    setExpandedOrderId(expanded ? null : o.id)
                  }
                >
                  <div className="text-left">
                    <p className="text-sm font-medium">
                      #{o.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {o.status}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      ₹{Number(o.total).toFixed(0)}
                    </span>
                    {expanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="pt-2 space-y-2 border-t">
                    {o.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm"
                      >
                        <div>
                          {item.medicineName} × {item.quantity}
                        </div>
                        <div>
                          ₹{Number(item.total).toFixed(0)}
                        </div>
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