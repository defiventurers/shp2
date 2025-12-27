import { Link, useLocation } from "wouter";
import { Home, Package, ShoppingCart, ClipboardList } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/inventory", icon: Package, label: "Inventory" },
  { path: "/cart", icon: ShoppingCart, label: "Cart" },
  { path: "/orders", icon: ClipboardList, label: "Orders" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { itemCount } = useCartContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          const isCart = path === "/cart";
          
          return (
            <Link key={path} href={path}>
              <button
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full relative transition-colors duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                  {isCart && itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center justify-center">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] mt-1 font-medium",
                  isActive && "font-semibold"
                )}>
                  {label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
