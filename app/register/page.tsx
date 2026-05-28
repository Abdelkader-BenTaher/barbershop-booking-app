"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import Link from "next/link";
import { getBrowserSessionUser, upsertProfile } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    async function checkUser() {
      try {
        const user = await getBrowserSessionUser();

        if (user) {
          router.replace("/dashboard");
        }
      } catch (error) {
        console.error("Failed to load auth session", error);
      }
    }

    void checkUser();
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleRegister() {
    if (!formData.email || !formData.password) {
      toast.error("Please fill all fields");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setLoading(false);

      toast.error(error.message);
      return;
    }

    // CREATE USER PROFILE
    if (data.user) {
      try {
        await upsertProfile(data.user, {
          full_name: "",
          phone: "",
        });
      } catch (error) {
        console.error("Failed to create profile", error);
        toast.error("Account created, but the profile was not saved");
      }
    }

    setLoading(false);

    toast.success("Account created successfully!");

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-bold text-center">Create Account</h1>

        <p className="text-zinc-400 text-center mt-4">
          Join Fade Studio today.
        </p>

        <div className="space-y-6 mt-10">
          {/* Email */}
          <div>
            <label className="block mb-3 text-sm text-zinc-400">Email</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-3 text-sm text-zinc-400">Password</label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />
          </div>
        </div>

        {/* Register Button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full mt-10 bg-white text-black py-4 rounded-2xl font-bold hover:scale-[1.02] transition disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        {/* Login Link */}
        <p className="text-zinc-400 text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-white font-semibold">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
