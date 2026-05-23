"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

type Appointment = {
  id: string;
  service: string;
  barber: string;
  appointment_date: string;
  appointment_time: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // LOAD PROFILE
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile({
      full_name: profileData?.full_name || "",
      phone: profileData?.phone || "",
      email: user.email || "",
    });

    // LOAD APPOINTMENTS
    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user.id)
      .order("appointment_date", {
        ascending: true,
      });

    setAppointments(appointmentsData || []);

    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  }

  async function saveProfile() {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to save profile");
      return;
    }

    toast.success("Profile updated");
  }

  async function cancelAppointment(id: string) {
    const confirmed = confirm("Cancel this appointment?");

    if (!confirmed) return;

    const { error } = await supabase.from("appointments").delete().eq("id", id);

    if (error) {
      toast.error("Failed to cancel appointment");

      return;
    }

    toast.success("Appointment cancelled");

    loadDashboard();
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold">My Dashboard</h1>

          <p className="text-zinc-400 mt-4">
            Manage your profile and appointments.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* PROFILE */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <h2 className="text-3xl font-bold">Profile</h2>

              <div className="space-y-6 mt-8">
                <div>
                  <label className="block mb-3 text-sm text-zinc-400">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-3 text-sm text-zinc-400">
                    Phone Number
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    placeholder="+1 234 567 890"
                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-3 text-sm text-zinc-400">
                    Email
                  </label>

                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none text-zinc-500"
                  />
                </div>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:scale-[1.02] transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>

          {/* APPOINTMENTS */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <h2 className="text-3xl font-bold">My Appointments</h2>

              {appointments.length === 0 ? (
                <div className="mt-8 text-zinc-400">No appointments found.</div>
              ) : (
                <div className="grid gap-6 mt-8">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-black border border-zinc-800 rounded-2xl p-6"
                    >
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-zinc-500 text-sm">Service</p>

                          <h3 className="text-2xl font-bold mt-2">
                            {appointment.service}
                          </h3>
                        </div>

                        <div>
                          <p className="text-zinc-500 text-sm">Schedule</p>

                          <div className="mt-2 space-y-1 text-zinc-300">
                            <p>Barber: {appointment.barber}</p>

                            <p>Date: {appointment.appointment_date}</p>

                            <p>Time: {appointment.appointment_time}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => cancelAppointment(appointment.id)}
                        className="mt-6 bg-red-500 text-white px-5 py-3 rounded-xl hover:opacity-90 transition"
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
