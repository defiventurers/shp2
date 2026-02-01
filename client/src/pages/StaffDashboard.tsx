import { useEffect } from "react";
import { useLocation } from "wouter";
import { Package, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StaffDashboard() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const isStaff = localStorage.getItem("staff_auth") === "true";
    if (!isStaff) {
      navigate("/staff/login");
    }
  }, [navigate]);

  function logout() {
    localStorage.removeItem("staff_auth");
    navigate("/staff/login");
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-lg font-semibold flex items-center gap-2">
        <Shield className="w-5 h-5 text-green-600" />
        Staff Dashboard
      </h1>

      <Card className="p-4 space-y-2">
        <p className="text-sm">
          You are logged in as <strong>Pharmacist</strong>.
        </p>
        <p className="text-xs text-muted-foreground">
          Order management will appear here next.
        </p>
      </Card>

      <Card className="p-4 flex items-center gap-3">
        <Package className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="font-medium text-sm">Orders</p>
          <p className="text-xs text-muted-foreground">
            View and update order statuses
          </p>
        </div>
      </Card>

      <Button
        variant="destructive"
        className="w-full"
        onClick={logout}
      >
        Logout Staff
      </Button>
    </div>
  );
}