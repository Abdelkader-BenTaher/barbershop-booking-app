"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  getBrowserSessionUser,
  getUserRole,
  isAdminRole,
  waitForBrowserSessionUser,
} from "@/lib/auth";

type Barber = {
  id: string;
  name: string;
  working_days: string[];
};

type Notice = {
  title: string;
  body: string;
  href: string;
  cta: string;
};

function normalizeBarber(barber: Record<string, unknown>): Barber {
  return {
    id: String(barber.id || ""),
    name: String(barber.name || ""),
    working_days: Array.isArray(barber.working_days)
      ? barber.working_days.map((day) => String(day))
      : typeof barber.working_days === "string"
      ? [barber.working_days]
      : [],
  };
}

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AdminBarbersPage() {
  const router = useRouter();

  const [barbers, setBarbers] = useState<Barber[]>([]);

  const [loading, setLoading] = useState(true);

  const [notice, setNotice] = useState<Notice | null>(null);

  const [newBarber, setNewBarber] = useState("");

  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  async function checkAdmin() {
    try {
      const user = await waitForBrowserSessionUser();

      if (!user) {
        setNotice({
          title: "Login required",
          body: "Redirecting you to login before opening barber management.",
          href: "/login",
          cta: "Go to login",
        });
        router.replace("/login");
        return;
      }

      const role = await getUserRole(user);

      if (!isAdminRole(role)) {
        console.warn("Admin barber management access denied", {
          userId: user.id,
          email: user.email,
          role,
        });
        toast.error("Access denied");
        setNotice({
          title: "Admin access required",
          body: "Your account is signed in, but it is not marked as an admin for this site.",
          href: "/dashboard",
          cta: "Go to dashboard",
        });
        router.replace("/dashboard");
        return;
      }

      await fetchBarbers();
    } catch (error) {
      console.error("Failed to load barber management", error);
      toast.error("Failed to load barber management");
      setNotice({
        title: "Barber management unavailable",
        body: "We could not verify your admin profile or load barbers. Please try again.",
        href: "/admin",
        cta: "Back to admin",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchBarbers() {
    const { data, error } = await supabase.from("barbers").select("*");

    if (error) {
      throw error;
    }

    setBarbers((data || []).map(normalizeBarber));
  }

  useEffect(() => {
    void checkAdmin();
  }, []);

  function toggleDay(day: string) {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  }

  async function addBarber() {
    if (!newBarber) {
      toast.error("Enter barber name");
      return;
    }

    if (selectedDays.length === 0) {
      toast.error("Select at least one working day");

      return;
    }

    const { error } = await supabase.from("barbers").insert([
      {
        name: newBarber,
        working_days: selectedDays,
      },
    ]);

    if (error) {
      toast.error("Failed to add barber");
      return;
    }

    toast.success("Barber added");

    setNewBarber("");

    setSelectedDays([]);

    try {
      await fetchBarbers();
    } catch (error) {
      console.error("Failed to refresh barbers", error);
      toast.error("Failed to refresh barbers");
    }
  }

  async function deleteBarber(id: string) {
    const confirmed = confirm("Delete this barber?");

    if (!confirmed) return;

    const { error } = await supabase.from("barbers").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete barber");
      return;
    }

    toast.success("Barber deleted");

    try {
      await fetchBarbers();
    } catch (error) {
      console.error("Failed to refresh barbers", error);
      toast.error("Failed to refresh barbers");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  if (notice) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center">
          <h1 className="text-3xl font-bold">{notice.title}</h1>

          <p className="text-zinc-400 mt-4">{notice.body}</p>

          <Link
            href={notice.href}
            className="inline-block mt-8 bg-white text-black px-6 py-3 rounded-xl font-semibold"
          >
            {notice.cta}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold">Manage Barbers</h1>

          <p className="text-zinc-400 mt-4">Add and manage barber schedules.</p>
        </div>

        {/* ADD BARBER */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-10">
          <h2 className="text-2xl font-bold">Add Barber</h2>

          <div className="mt-6">
            <input
              type="text"
              value={newBarber}
              onChange={(e) => setNewBarber(e.target.value)}
              placeholder="Barber Name"
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {days.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`py-3 rounded-xl border transition ${
                  selectedDays.includes(day)
                    ? "bg-white text-black border-white"
                    : "border-zinc-700 hover:bg-zinc-800"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <button
            onClick={addBarber}
            className="mt-8 bg-white text-black px-6 py-4 rounded-2xl font-bold hover:scale-[1.02] transition"
          >
            Add Barber
          </button>
        </div>

        {/* BARBER LIST */}
        <div className="grid gap-6">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8"
            >
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-bold">{barber.name}</h2>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {barber.working_days.map((day) => (
                      <span
                        key={day}
                        className="bg-zinc-800 px-4 py-2 rounded-xl text-sm"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => deleteBarber(barber.id)}
                  className="bg-red-500 text-white px-5 py-3 rounded-xl hover:opacity-90 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
