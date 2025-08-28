"use client";

import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/firebase/client";
import { signOut } from "@/lib/actions/auth.action";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const monaSans = Mona_Sans({
  subsets: ["latin"],
  variable: "--font-mona-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on an auth page (sign-in or sign-up)
  const isAuthPage = pathname?.startsWith("/sign-");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      // 1. Sign out from Firebase client-side
      await firebaseSignOut(auth);

      // 2. Clear server-side session cookie
      await signOut();

      // 3. Clear local user state
      setUser(null);

      // 4. Clear any cached data
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // 5. Force redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      // Force redirect even if there's an error
      window.location.href = "/";
    }
  };

  return (
    <html lang="en">
      <body className={`${monaSans.variable} antialiased`}>
        {/* Show navigation only when NOT on auth pages */}
        {!isAuthPage && (
          <nav className="w-full border-b border-white/10 backdrop-blur-md bg-white/5 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-buddy-orange-500 to-buddy-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">I</span>
                  </div>
                  <span className="text-xl font-bold text-white">
                    InterviewBuddy
                  </span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center space-x-8">
                  <Link
                    href="/"
                    className={`px-3 py-1 rounded-full transition-all ${
                      pathname === "/"
                        ? "bg-white text-black"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    href="/features"
                    className={`px-3 py-1 rounded-full transition-all ${
                      pathname === "/features"
                        ? "bg-white text-black"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Features
                  </Link>
                </div>

                {/* Authentication Buttons */}
                <div className="flex items-center space-x-4">
                  {loading ? (
                    <div className="w-20 h-10 bg-white/10 rounded-full animate-pulse"></div>
                  ) : user ? (
                    <div className="flex items-center space-x-4">
                      <span className="text-white/80 text-sm">
                        Hi, {user.displayName || user.email?.split("@")[0]}
                      </span>
                      <button
                        onClick={handleSignOut}
                        className="btn-secondary px-4 py-2 text-sm"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link href="/sign-in">
                        <button className="btn-secondary px-4 py-2 text-sm">
                          Sign In
                        </button>
                      </Link>
                      <Link href="/sign-up">
                        <button className="btn-primary px-4 py-2 text-sm">
                          Sign Up
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </nav>
        )}

        {children}
        <Toaster />
      </body>
    </html>
  );
}
