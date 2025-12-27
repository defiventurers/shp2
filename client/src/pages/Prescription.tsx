import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartContext } from "@/context/CartContext";

export default function PrescriptionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    prescriptions,
    selectedPrescriptionId,
    addPrescription,
    deletePrescription,
    selectPrescription,
  } = useCartContext();

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("images", f));

      const res = await fetch("/api/prescriptions/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => addPrescription(data.prescription),
  });

  return (
    <div className="p-4 space-y-4">
      <Button onClick={() => fileInputRef.current?.click()}>
        Upload Multi-Page Prescription
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => e.target.files && uploadMutation.mutate(e.target.files)}
      />

      {prescriptions.map((p) => (
        <Card key={p.id} className="p-3">
          <div className="flex gap-2">
            {p.imageUrls.map((url, i) => (
              <img key={i} src={url} className="w-16 h-16 rounded" />
            ))}
          </div>

          {selectedPrescriptionId === p.id && (
            <CheckCircle className="text-green-600" />
          )}

          <div className="flex gap-2 mt-2">
            <Button onClick={() => selectPrescription(p.id)}>Select</Button>
            <Button variant="destructive" onClick={() => deletePrescription(p.id)}>
              <Trash2 />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}