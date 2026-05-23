"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

type Barber = {
  id: string;
  name: string;
  working_days: string[];
};

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

  const [newBarber, setNewBarber] = useState("");

  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchBarbers();
  }

  async function fetchBarbers() {
    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      toast.error("Failed to load barbers");
      return;
    }

    setBarbers(data || []);

    setLoading(false);
  }

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

    fetchBarbers();
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

    fetchBarbers();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
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
