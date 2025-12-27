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
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));

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
      toast({ title: "Prescription saved" });
      navigate("/checkout");
    },
    onError: () =>
      toast({ title: "Upload failed", variant: "destructive" }),
    onSettled: () => setUploading(false),
  });

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    setFiles((p) => [...p, ...selected]);
    setPreviews((p) => [...p, ...selected.map((f) => URL.createObjectURL(f))]);
  }

  function removePage(index: number) {
    setFiles((p) => p.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  }

  if (!isAuthenticated) {
    return <p className="p-4">Please login to upload prescription</p>;
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-semibold text-lg">Prescriptions</h1>

      {/* UPLOAD */}
      <Card className="p-4 text-center border-dashed border-2">
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
          onChange={handleFiles}
        />
      </Card>

      {/* PREVIEW */}
      {previews.map((src, i) => (
        <Card key={i} className="p-2 flex items-center gap-3">
          <img src={src} className="w-16 h-16 rounded object-cover" />
          <Button size="icon" variant="ghost" onClick={() => removePage(i)}>
            <Trash2 size={14} />
          </Button>
        </Card>
      ))}

      {files.length > 0 && (
        <Button
          className="w-full"
          disabled={uploading}
          onClick={() => {
            setUploading(true);
            uploadMutation.mutate();
          }}
        >
          {uploading ? "Saving..." : "Save Prescription"}
        </Button>
      )}

      {/* EXISTING */}
      {prescriptions.map((p) => (
        <Card
          key={p.id}
          className={`p-3 ${
            selectedPrescriptionId === p.id ? "border-green-500" : ""
          }`}
        >
          <img
            src={p.imageUrls[0]}
            className="w-16 h-16 rounded object-cover"
          />

          {selectedPrescriptionId === p.id && (
            <p className="text-green-600 text-sm flex items-center gap-1">
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
    </div>
  );
}