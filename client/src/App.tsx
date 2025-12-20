import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { WhatsAppButton } from "@/components/WhatsAppButton";

import { useAuth } from "@/hooks/useAuth";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import Prescription from "@/pages/Prescription";
import Admin from "@/pages/Admin";

/* -----------------------------
   Router
------------------------------ */
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/prescription" component={Prescription} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

/* -----------------------------
   App
------------------------------ */
function App() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <div className="min-h-screen bg-background">
            <Header />

            {/* 🔐 Auth debug banner (temporary, safe) */}
            {!isLoading && (
              <div className="px-3 py-1 text-xs text-center bg-muted border-b">
                {isAuthenticated ? (
                  <span className="text-green-600">
                    Logged in as {user?.email}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Not logged in
                  </span>
                )}
              </div>
            )}

            <main className="pb-safe">
              <Router />
            </main>

            <BottomNav />
            <WhatsAppButton />
          </div>

          <Toaster />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
