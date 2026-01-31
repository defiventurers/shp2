import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, FileText, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
};

export default function Profile() {
  const { user } = useAuth();
  const { prescriptions } = useCartContext();

  /* -----------------------------
     Fetch Orders
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

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-lg font-semibold">Profile</h1>

      {/* -----------------------------
         USER INFO
      ------------------------------ */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Account</span>
        </div>

        <p className="text-sm">
          <strong>Name:</strong> {user.name || "—"}
        </p>
        <p className="text-sm">
          <strong>Email:</strong> {user.email || "—"}
        </p>
        <p className="text-sm text-muted-foreground">
          (Phone & address editable in next step)
        </p>
      </Card>

      {/* -----------------------------
         PRESCRIPTIONS
      ------------------------------ */}
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
              <div>
                <p className="text-sm font-medium">
                  {user.name || "Prescription"} –{" "}
                  {new Date(p.createdAt).toLocaleDateString("en-GB")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.imageUrls?.length || 0} page(s)
                </p>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* -----------------------------
         ORDERS
      ------------------------------ */}
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
          orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between border rounded-md p-2"
            >
              <div>
                <p className="text-sm font-medium">
                  #{order.orderNumber}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {order.status}
                </p>
              </div>
              <p className="text-sm font-semibold">
                ₹{Number(order.total).toFixed(0)}
              </p>
            </div>
          ))
        )}
      </Card>

      {/* -----------------------------
         FUTURE ACTIONS
      ------------------------------ */}
      <Button variant="outline" className="w-full" disabled>
        Edit Profile (coming next)
      </Button>
    </div>
  );
}