import { Link } from "wouter";
import { Upload, Package, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-4 pt-8 max-w-lg mx-auto text-center">
        <h1 className="text-2xl font-bold mb-2">Sacred Heart Pharmacy</h1>

        {!isAuthenticated ? (
          <GoogleLoginButton />
        ) : (
          <p className="text-sm">Signed in as {user?.name}</p>
        )}
      </div>

      <div className="px-4 mt-6 max-w-lg mx-auto grid grid-cols-2 gap-3">
        <Link href="/prescription">
          <Card className="p-4 cursor-pointer">
            <Upload className="mb-2" />
            Upload Prescription
          </Card>
        </Link>

        <Link href="/inventory">
          <Card className="p-4 cursor-pointer">
            <Package className="mb-2" />
            Browse Inventory
          </Card>
        </Link>
      </div>

      <Card className="mt-4 p-4 max-w-lg mx-auto">
        <Phone className="mb-2" />
        <WhatsAppButton variant="inline" />
      </Card>
    </div>
  );
}