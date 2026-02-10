import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";

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
  const { prescriptions, refreshPrescriptions } = useCartContext();

  useEffect(() => {
    fetch("/api/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function deletePrescription(id: string) {
    if (!confirm("Delete this prescription?")) return;

    await fetch(`/api/prescriptions/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    refreshPrescriptions();
  }

  if (loading) {
    return <div className="p-6 text-center">Loading profile…</div>;
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      {/* PRESCRIPTIONS */}
      <div>
        <h2 className="text-lg font-semibold mb-2">My Prescriptions</h2>

        {prescriptions.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No prescriptions uploaded yet
          </p>
        )}

        <div className="space-y-3">
          {prescriptions.map((p) => (
            <Card key={p.id} className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Prescription ({p.imageUrls.length} page
                  {p.imageUrls.length > 1 ? "s" : ""})
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePrescription(p.id)}
                >
                  Delete
                </Button>
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {p.imageUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    className="h-20 rounded border"
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ORDERS */}
      <div>
        <h2 className="text-lg font-semibold mb-2">My Orders</h2>

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
    </div>
  );
}