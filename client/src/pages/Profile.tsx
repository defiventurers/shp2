import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, User } from "lucide-react";

type Prescription = {
  id: string;
  imageUrls: string[];
  createdAt: string;
};

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const {
    prescriptions,
    selectPrescription,
    selectedPrescriptionId,
  } = useCartContext();

  // 🔄 Fetch prescriptions from backend on page load
  const { data = [] } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
    enabled: isAuthenticated,
  });

  // Sync backend prescriptions into CartContext once
  useEffect(() => {
    if (data.length > 0 && prescriptions.length === 0) {
      data.forEach((p) => {
        // only add if not already present
        if (!prescriptions.find((x) => x.id === p.id)) {
          prescriptions.push(p as any);
        }
      });
    }
  }, [data]);

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Please sign in to view your profile
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">

        {/* ---------------- USER INFO ---------------- */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <User size={16} />
            <h2 className="font-semibold text-sm">My Profile</h2>
          </div>

          <p className="text-sm">
            <strong>Name:</strong> {user?.name || "—"}
          </p>
          <p className="text-sm">
            <strong>Email:</strong> {user?.email || "—"}
          </p>
        </Card>

        {/* ---------------- PRESCRIPTIONS ---------------- */}
        <div>
          <h3 className="font-semibold text-sm mb-2">
            Uploaded Prescriptions
          </h3>

          {prescriptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No prescriptions uploaded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((p) => {
                const isSelected = selectedPrescriptionId === p.id;

                return (
                  <Card
                    key={p.id}
                    className={`p-3 flex items-center gap-3 ${
                      isSelected ? "border-green-600" : ""
                    }`}
                  >
                    <img
                      src={p.imageUrls[0]}
                      alt="Prescription"
                      className="w-14 h-14 object-cover rounded"
                    />

                    <div className="flex-1">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <FileText size={14} />
                        Prescription
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.imageUrls.length} page(s) •{" "}
                        {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => selectPrescription(p.id)}
                    >
                      {isSelected ? "Selected" : "Use"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ---------------- ORDERS (COMING NEXT) ---------------- */}
        <Card className="p-4 text-sm text-muted-foreground">
          Orders section coming next…
        </Card>
      </div>
    </div>
  );
}