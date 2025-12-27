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
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (images: File[]) => {
      const formData = new FormData();
      images.forEach((f) => formData.append("images", f));

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
      setFiles([]);
      toast({ title: "Prescription uploaded (multi-page)" });
    },
    onError: () => {
      toast({ title: "Upload failed", variant: "destructive" });
    },
    onSettled: () => setUploading(false),
  });

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function submit() {
    if (files.length === 0) return;
    setUploading(true);
    uploadMutation.mutate(files);
  }

  if (!isAuthenticated) {
    return <p className="p-4">Please login</p>;
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-semibold text-lg">Multi-page Prescriptions</h1>

      <Card className="p-4 border-dashed border-2 text-center">
        <Upload className="mx-auto mb-2" />
        <Button onClick={() => fileInputRef.current?.click()}>
          Add Pages
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleSelect}
        />
      </Card>

      {files.map((f, i) => (
        <Card key={i} className="p-2 flex items-center gap-3">
          <span className="text-sm flex-1">{f.name}</span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => removeFile(i)}
          >
            <Trash2 size={14} />
          </Button>
        </Card>
      ))}

      {files.length > 0 && (
        <Button
          className="w-full"
          disabled={uploading}
          onClick={submit}
        >
          {uploading ? "Uploading..." : "Upload Prescription"}
        </Button>
      )}

      {prescriptions.map((p) => (
        <Card
          key={p.id}
          className={`p-3 ${
            selectedPrescriptionId === p.id
              ? "border-green-500"
              : ""
          }`}
        >
          <div className="flex gap-2 overflow-x-auto">
            {p.imageUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                className="w-16 h-16 rounded object-cover"
              />
            ))}
          </div>

          <div className="flex justify-between mt-2">
            <Button size="sm" onClick={() => selectPrescription(p.id)}>
              Select
            </Button>
            {selectedPrescriptionId === p.id && (
              <span className="text-green-600 text-sm flex items-center gap-1">
                <CheckCircle size={14} /> Selected
              </span>
            )}
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