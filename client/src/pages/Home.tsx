import { Link } from "wouter";
import {
  Upload,
  Package,
  Clock,
  Truck,
  Shield,
  MapPin,
  Phone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ---------------- HERO ---------------- */}
      <div
        className="relative text-white overflow-hidden"
        style={{ backgroundColor: "#0B6F3A" }} // brand green
      >
        {/* very subtle texture */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_top,white,transparent_70%)]" />

        {/* ⬇️ HERO CONTENT — REDUCED HEIGHT */}
        <div className="relative px-4 pt-6 pb-2">
          <div className="max-w-lg mx-auto text-center">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Sacred Heart Pharmacy"
                  className="w-10 h-10"
                />
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold mb-1">
              Sacred Heart Pharmacy
            </h1>

            <p className="text-white/80 text-xs mb-1">
              Austin Town, Victoria Layout, Bengaluru, Karnataka 560047
            </p>

            <div className="flex items-center justify-center gap-1 text-[11px] text-white/70 mb-2">
              <MapPin className="w-3 h-3" />
              <span>
                16, Campbell Rd, opposite to ST. PHILOMENA&apos;S HOSPITAL
              </span>
            </div>

            <p className="text-white/90 text-xs max-w-xs mx-auto mb-3">
              Order medicines online with prescription upload.
            </p>

            {!isAuthenticated ? (
              <div className="flex justify-center">
                <GoogleLoginButton />
              </div>
            ) : (
              <p className="text-xs font-medium">
                Welcome back{user?.name ? `, ${user.name}` : ""} 👋
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- MAIN CONTENT ---------------- */}
      {/* ⬇️ NOW CLEARLY BELOW HERO */}
      <div className="px-4 mt-3 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/prescription">
            <Card className="p-4 hover-elevate cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="font-semibold text-sm mb-1">
                Upload Prescription
              </h3>
              <p className="text-xs text-muted-foreground">
                Upload & auto-detect medicines
              </p>
            </Card>
          </Link>

          <Link href="/inventory">
            <Card className="p-4 hover-elevate cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="font-semibold text-sm mb-1">
                Browse Inventory
              </h3>
              <p className="text-xs text-muted-foreground">
                1000+ medicines available
              </p>
            </Card>
          </Link>
        </div>

        <Card className="mt-4 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-0.5">Need Help?</h3>
              <p className="text-xs text-muted-foreground">
                Chat with our pharmacist on WhatsApp
              </p>
            </div>
            <WhatsAppButton variant="inline" />
          </div>
        </Card>

        <div className="mt-6">
          <h2 className="font-semibold text-lg mb-4">Why Choose Us</h2>
          <div className="grid gap-3">
            {[
              {
                icon: Truck,
                title: "Fast Delivery",
                desc: "Same day delivery in Bangalore",
              },
              {
                icon: Shield,
                title: "100% Genuine",
                desc: "All medicines sourced from authorized distributors",
              },
              {
                icon: Clock,
                title: "Open 7 Days",
                desc: "9 AM - 10 PM, including weekends",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{title}</h4>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}