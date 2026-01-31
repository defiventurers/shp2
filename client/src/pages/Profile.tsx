import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Package } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { user, isLoading } = useAuth();

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const { data: prescriptions = [] } = useQuery<any[]>({
    queryKey: ["/api/prescriptions"],
    enabled: !!user,
  });

  if (isLoading) {
    return <p className="p-4">Loading profile…</p>;
  }

  if (!user) {
    return (
      <div className="p-4">
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-6">
      {/* USER INFO */}
      <Card className="p-4 space-y-1">
        <h2 className="font-semibold text-lg">Profile</h2>
        <p className="text-sm text-muted-foreground">
          {user.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {user.email}
        </p>
      </Card>

      {/* ORDERS */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Package size={18} />
          <h3 className="font-medium">My Orders</h3>
        </div>

        <Separator />

        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-md p-3 text-sm space-y-1"
            >
              <p>
                <strong>Order:</strong> #{order.orderNumber}
              </p>
              <p>
                <strong>Total:</strong> ₹{order.total}
              </p>
              <p className="text-muted-foreground">
                {order.status}
              </p>
            </div>
          ))
        )}
      </Card>

      {/* PRESCRIPTIONS */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText size={18} />
          <h3 className="font-medium">My Prescriptions</h3>
        </div>

        <Separator />

        {prescriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No prescriptions uploaded.
          </p>
        ) : (
          prescriptions.map((p) => (
            <div
              key={p.id}
              className="border rounded-md p-3 space-y-2"
            >
              <p className="text-sm">
                Uploaded on{" "}
                {new Date(p.createdAt).toLocaleDateString()}
              </p>

              <div className="flex gap-2 flex-wrap">
                {(p.imageUrls || []).map((url: string, idx: number) => (
                  <img
                    key={idx}
                    src={url}
                    className="w-16 h-16 object-cover rounded"
                    alt="Prescription"
                  />
                ))}
              </div>
            </div>
          ))
        )}

        <Button asChild variant="outline" size="sm">
          <Link href="/prescription">Upload New Prescription</Link>
        </Button>
      </Card>
    </div>
  );
}