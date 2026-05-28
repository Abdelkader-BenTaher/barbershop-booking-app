"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  getBrowserSessionUser,
  getMetadataRole,
  getUserRole,
  isAdminRole,
  waitForBrowserSessionUser,
} from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();

  const [loggedIn, setLoggedIn] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function syncAuth(userFromEvent?: User | null) {
      try {
        const user = userFromEvent ?? (await waitForBrowserSessionUser());

        if (!active) return;

        setLoggedIn(!!user);

        if (!user) {
          setIsAdmin(false);
          return;
        }

        try {
          const role = await getUserRole(user);

          if (!active) return;

          setIsAdmin(isAdminRole(role));
        } catch (error) {
          console.error("Failed to load profile role", error);

          if (!active) return;

          setIsAdmin(isAdminRole(getMetadataRole(user)));
        }
      } catch (error) {
        console.error("Failed to load auth session", error);

        if (!active) return;

        setLoggedIn(false);
        setIsAdmin(false);
      }
    }

    void syncAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void syncAuth(session?.user ?? null);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      console.error("Failed to sign out", error);
    }

    setLoggedIn(false);

    setIsAdmin(false);

    setMobileMenuOpen(false);

    router.replace("/");
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-800 bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Fade Studio
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-zinc-300 hover:text-white transition">
            Home
          </Link>

          <Link
            href="/booking"
            className="text-zinc-300 hover:text-white transition"
          >
            Booking
          </Link>

          {loggedIn && (
            <>
              <Link
                href="/dashboard"
                className="text-zinc-300 hover:text-white transition"
              >
                Dashboard
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-zinc-300 hover:text-white transition"
                >
                  Admin
                </Link>
              )}

              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="bg-white text-black px-5 py-2 rounded-xl font-semibold hover:scale-105 transition"
                >
                  My Account
                </Link>

                <button
                  onClick={handleLogout}
                  className="border border-zinc-700 px-5 py-2 rounded-xl hover:bg-zinc-900 transition"
                >
                  Logout
                </button>
              </div>
            </>
          )}

          {!loggedIn && (
            <>
              <Link
                href="/login"
                className="text-zinc-300 hover:text-white transition"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="bg-white text-black px-5 py-2 rounded-xl font-semibold hover:scale-105 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden"
        >
          {mobileMenuOpen ? <X size={30} /> : <Menu size={30} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-black">
          <nav className="flex flex-col p-6 gap-6">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-zinc-300 hover:text-white transition"
            >
              Home
            </Link>

            <Link
              href="/booking"
              onClick={() => setMobileMenuOpen(false)}
              className="text-zinc-300 hover:text-white transition"
            >
              Booking
            </Link>

            {loggedIn && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-zinc-300 hover:text-white transition"
                >
                  Dashboard
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-zinc-300 hover:text-white transition"
                  >
                    Admin
                  </Link>
                )}

                <div className="flex flex-col gap-4">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-white text-black px-5 py-3 rounded-xl font-semibold text-center"
                  >
                    My Account
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="border border-zinc-700 px-5 py-3 rounded-xl hover:bg-zinc-900 transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}

            {!loggedIn && (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-zinc-300 hover:text-white transition"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-white text-black px-5 py-3 rounded-xl font-semibold text-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
