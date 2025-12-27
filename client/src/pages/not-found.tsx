import { Link } from "wouter";
import { Home, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center pb-20">
      <div className="text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-medium text-muted-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild data-testid="button-go-home-404">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
