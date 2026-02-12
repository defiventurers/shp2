import { Card } from "@/components/ui/card";
import { Clock, ShieldCheck, Truck } from "lucide-react";

const FEATURES = [
  {
    title: "Fast Delivery",
    subtitle: "Same day delivery in Bangalore",
    icon: Truck,
  },
  {
    title: "100% Genuine",
    subtitle: "All medicines sourced from authorized distributors",
    icon: ShieldCheck,
  },
  {
    title: "Open 6 Days",
    subtitle: "9AM - 10PM, except Sunday.",
    icon: Clock,
  },
] as const;

export function WhyChooseUs() {
  return (
    <section className="mt-6">
      <h2 className="text-base font-semibold mb-3">Why Choose Us</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;

          return (
            <Card key={feature.title} className="p-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-[#0A7A3D]" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.subtitle}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
