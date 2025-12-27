import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Upload, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCartContext } from "@/context/CartContext";

export default function PrescriptionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const {
    prescriptions,
    selectedPrescriptionId,
    addPrescription,
    selectPrescription,
    deletePrescription,
  } = useCartContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("images", f));

      const res = await fetch("/api/prescriptions/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      addPrescription(data.prescription);
      toast({ title: "Prescription uploaded (multi-page)" });
    },
    onSettled: () => setUploading(false),
  });

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setUploading(true);
    uploadMutation.mutate(e.target.files);
  }

  if (!isAuthenticated) return <p className="p-4">Login required</p>;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <Card className="p-4 border-dashed border-2 text-center">
        <Upload className="mx-auto mb-2" />
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          Upload Multi-Page Prescription
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleUpload}
        />
      </Card>

      {prescriptions.map((p) => (
        <Card
          key={p.id}
          className={`p-3 ${selectedPrescriptionId === p.id ? "border-green-500" : ""}`}
        >
          <div className="flex gap-2 mb-2">
            {p.imageUrls.map((url, i) => (
              <img key={i} src={url} className="w-14 h-14 rounded object-cover" />
            ))}
          </div>

          {selectedPrescriptionId === p.id && (
            <p className="text-green-600 text-sm flex gap-1">
              <CheckCircle size={14} /> Selected
            </p>
          )}

          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => selectPrescription(p.id)}>
              Select
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deletePrescription(p.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </Card>
      ))}

      <Button
        className="w-full"
        disabled={!selectedPrescriptionId}
        onClick={() => navigate("/checkout")}
      >
        Continue to Checkout
      </Button>
    </div>
  );
}