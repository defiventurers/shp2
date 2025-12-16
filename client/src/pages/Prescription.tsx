import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Upload, FileText, Check, Plus, AlertTriangle, Trash2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useCartContext } from "@/context/CartContext";
import type { Prescription, Medicine } from "@shared/schema";

interface ExtractedMedicine {
  name: string;
  dosage?: string;
  matched?: Medicine;
}

export default function PrescriptionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCartContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedMedicines, setExtractedMedicines] = useState<ExtractedMedicine[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
    enabled: isAuthenticated,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch("/api/prescriptions/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      setExtractedMedicines(data.extractedMedicines || []);
      setIsProcessing(false);
      toast({
        title: "Prescription uploaded",
        description: data.extractedMedicines?.length
          ? `Found ${data.extractedMedicines.length} medicine(s)`
          : "Prescription saved successfully",
      });
    },
    onError: (error: Error) => {
      setIsProcessing(false);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsProcessing(true);
    setExtractedMedicines([]);
    uploadMutation.mutate(file);
  };

  const addToCart = (medicine: Medicine) => {
    addItem(medicine);
    toast({
      title: "Added to cart",
      description: `${medicine.name} added to your cart`,
    });
  };

  const addAllToCart = () => {
    const matchedMedicines = extractedMedicines.filter((m) => m.matched);
    matchedMedicines.forEach((m) => {
      if (m.matched) addItem(m.matched);
    });
    toast({
      title: "Added to cart",
      description: `${matchedMedicines.length} medicine(s) added to your cart`,
    });
    navigate("/cart");
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    setExtractedMedicines([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-semibold text-xl mb-2">Login to Upload Prescription</h2>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            Sign in to upload and manage your prescriptions
          </p>
          <Button asChild>
            <a href="/api/login" data-testid="button-login-prescription">
              Login to Continue
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 py-4 max-w-lg mx-auto">
        <h1 className="font-semibold text-lg mb-4">Upload Prescription</h1>

        {!previewUrl ? (
          <Card className="p-6 border-dashed border-2">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-medium text-base mb-1">Upload Your Prescription</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Take a photo or upload an image. We'll auto-detect the medicines for you.
              </p>

              <div className="flex gap-3 w-full max-w-xs">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => cameraInputRef.current?.click()}
                  data-testid="button-camera"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-gallery"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Gallery
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="p-3 relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearPreview}
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm z-10"
                data-testid="button-clear-preview"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <img
                src={previewUrl}
                alt="Prescription preview"
                className="w-full rounded-lg object-contain max-h-64"
              />
            </Card>

            {isProcessing ? (
              <Card className="p-6">
                <div className="flex flex-col items-center text-center">
                  <LoadingSpinner size="lg" className="mb-4" />
                  <h3 className="font-medium">Processing Prescription</h3>
                  <p className="text-sm text-muted-foreground">
                    Detecting medicines from your prescription...
                  </p>
                </div>
              </Card>
            ) : extractedMedicines.length > 0 ? (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-sm">Detected Medicines</h3>
                  <Badge variant="secondary" className="text-xs">
                    {extractedMedicines.filter((m) => m.matched).length} of {extractedMedicines.length} found
                  </Badge>
                </div>

                <div className="space-y-2">
                  {extractedMedicines.map((medicine, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        {medicine.matched ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{medicine.name}</p>
                          {medicine.dosage && (
                            <p className="text-xs text-muted-foreground">{medicine.dosage}</p>
                          )}
                        </div>
                      </div>
                      {medicine.matched && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(medicine.matched!)}
                          data-testid={`button-add-medicine-${index}`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {extractedMedicines.some((m) => m.matched) && (
                  <Button
                    className="w-full mt-4"
                    onClick={addAllToCart}
                    data-testid="button-add-all"
                  >
                    Add All to Cart
                  </Button>
                )}
              </Card>
            ) : (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Prescription Saved</p>
                    <p className="text-xs text-muted-foreground">
                      You can use this during checkout
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Button variant="outline" className="w-full" onClick={clearPreview}>
              Upload Another Prescription
            </Button>
          </div>
        )}

        {prescriptions.length > 0 && !previewUrl && (
          <div className="mt-8">
            <h2 className="font-medium text-sm mb-3">Previous Prescriptions</h2>
            <div className="space-y-2">
              {prescriptions.map((prescription) => (
                <Card key={prescription.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Uploaded on{" "}
                        {new Date(prescription.createdAt!).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {prescription.status === "verified" ? "Verified" : "Pending verification"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
