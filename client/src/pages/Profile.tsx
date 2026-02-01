import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User as UserIcon,
  FileText,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

/* -----------------------------
   Types
------------------------------ */
type OrderItem = {
  id: string;
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
  const { prescriptions } = useCartContext();

  /* -----------------------------
     Editable profile state
  ------------------------------ */
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);

  /* -----------------------------
     Orders
  ------------------------------ */
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-lg font-semibold">Profile</h1>

      {/* =============================
         USER DETAILS (EDITABLE)
      ============================== */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Your Details</span>
        </div>

        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setSaved(false);
            }}
            placeholder="Enter phone number"
          />
        </div>

        <div className="space-y-2">
          <Label>Address</Label>
          <Input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setSaved(false);
            }}
            placeholder="Enter address"
          />
        </div>

        <Button
          onClick={() => setSaved(true)}
          className="w-full"
          variant="outline"
        >
          {saved ? "Saved ✓ (local)" : "Save Details"}
        </Button>
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
          prescriptions.map((p) => (
            <div
              key={p.id}
              className="border rounded-md p-2 space-y-1"
            >
              <p className="text-sm font-medium">
                {user.name?.split(" ")[0] || "Prescription"} –{" "}
                {new Date(p.createdAt).toLocaleDateString("en-GB")}
              </p>
              <p className="text-xs text-muted-foreground">
                {p.imageUrls?.length || 0} page(s)
              </p>
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
                className="border rounded-md"
              >
                <button
                  className="w-full flex items-center justify-between p-3 text-left"
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
                </button>

                {isOpen && order.items && (
                  <div className="border-t px-3 pb-3 space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
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