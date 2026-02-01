import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StaffLogin() {
  const [, navigate] = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    // ⚠️ TEMPORARY STATIC CREDENTIALS
    if (username === "shp" && password === "shp2") {
      localStorage.setItem("staff_auth", "true");
      navigate("/staff");
    } else {
      setError("Invalid staff credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-2 justify-center">
          <Shield className="w-5 h-5 text-green-600" />
          <h1 className="text-lg font-semibold">Staff Login</h1>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Username
          </label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter staff ID"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center">
            {error}
          </p>
        )}

        <Button className="w-full" onClick={handleLogin}>
          <Lock className="w-4 h-4 mr-2" />
          Login as Staff
        </Button>
      </Card>
    </div>
  );
}