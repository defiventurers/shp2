import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useCartContext } from "@/context/CartContext";

export default function PrescriptionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, loading } = useAuth();
  const { refreshPrescriptions, setSelectedPrescriptionId } =
    useCartContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  if (loading) return <p className="p-4">Checking login…</p>;
  if (!isAuthenticated)
    return <p className="p-4">Please login to upload prescription</p>;

  async function upload() {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/prescriptions/upload`,
      {
        method: "POST",
        body: fd,
        credentials: "include",
      }
    );

    if (!res.ok) {
      toast({ title: "Upload failed", variant: "destructive" });
      return;
    }

    const data = await res.json();
    await refreshPrescriptions();
    setSelectedPrescriptionId(data.prescription.id);
    navigate("/checkout");
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card className="p-4 border-dashed border-2 text-center">
        <Upload className="mx-auto mb-2" />
        <Button onClick={() => fileInputRef.current?.click()}>
          Select Images
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) =>
            setFiles(Array.from(e.target.files || []))
          }
        />
      </Card>

      <Button
        className="w-full mt-4"
        disabled={!files.length}
        onClick={upload}
      >
        Upload Prescription
      </Button>
    </div>
  );
}