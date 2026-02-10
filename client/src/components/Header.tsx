import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function Header() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({ title: "Logged out successfully" });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <header className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <Link href="/">
        <a className="text-white font-bold">Home</a>
      </Link>
      <nav className="flex space-x-4">
        {isAuthenticated && user ? (
          <>
            <span>Hello, {user.name}</span>
            <Button onClick={handleLogout} color="gray">
              Logout
            </Button>
          </>
        ) : (
          <Link href="/signin">
            <a>
              <Button color="gray">Sign In</Button>
            </a>
          </Link>
        )}
      </nav>
    </header>
  );
}
