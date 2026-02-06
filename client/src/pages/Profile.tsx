import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  items: {
    medicineName: string;
    quantity: number;
  }[];
};

export default function Profile() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading orders…</div>;
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <h2 className="text-lg font-semibold">My Orders</h2>

      {orders.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No orders placed yet
        </p>
      )}

      {orders.map((order) => (
        <Card key={order.id} className="p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">
              #{order.orderNumber}
            </span>
            <Badge>{order.status}</Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("en-IN")}
          </div>

          <ul className="text-sm list-disc ml-5">
            {order.items.map((i, idx) => (
              <li key={idx}>
                {i.medicineName} × {i.quantity}
              </li>
            ))}
          </ul>

          <div className="font-semibold">
            ₹{Number(order.total).toFixed(0)}
          </div>
        </Card>
      ))}
    </div>
  );
}