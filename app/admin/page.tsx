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

type Appointment = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  service: string;
  barber: string;
  appointment_date: string;
  appointment_time: string;
};

type Notice = {
  title: string;
  body: string;
  href: string;
  cta: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [loading, setLoading] = useState(true);

  const [notice, setNotice] = useState<Notice | null>(null);

  async function checkAdmin() {
    try {
      const user = await waitForBrowserSessionUser();

      if (!user) {
        setNotice({
          title: "Login required",
          body: "Redirecting you to login before opening the admin area.",
          href: "/login",
          cta: "Go to login",
        });
        router.replace("/login");
        return;
      }

      const role = await getUserRole(user);

      if (!isAdminRole(role)) {
        console.warn("Admin check failed", { userId: user.id, email: user.email, role });
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

      await fetchAppointments();
    } catch (error) {
      console.error("Failed to load admin page", error);
      toast.error("Failed to load admin dashboard");
      setNotice({
        title: "Admin dashboard unavailable",
        body: "We could not verify your admin profile or load appointments. Please try again.",
        href: "/dashboard",
        cta: "Go to dashboard",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchAppointments() {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    setAppointments(data || []);
  }

  useEffect(() => {
    void checkAdmin();
  }, []);

  async function deleteAppointment(id: string) {
    const confirmed = confirm("Delete this appointment?");

    if (!confirmed) return;

    const { error } = await supabase.from("appointments").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      return;
    }

    toast.success("Appointment deleted");

    try {
      await fetchAppointments();
    } catch (error) {
      console.error("Failed to refresh appointments", error);
      toast.error("Failed to refresh appointments");
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
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-bold">Admin Dashboard</h1>

            <p className="text-zinc-400 mt-4">Manage all appointments.</p>
          </div>

          <Link
            href="/admin/barbers"
            className="bg-white text-black px-6 py-4 rounded-2xl font-bold hover:scale-[1.02] transition text-center"
          >
            Manage Barbers
          </Link>
        </div>

        {/* EMPTY STATE */}
        {appointments.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            No appointments found.
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* CUSTOMER */}
                  <div>
                    <p className="text-zinc-500 text-sm">Customer</p>

                    <h2 className="text-2xl font-bold mt-2">
                      {appointment.full_name}
                    </h2>

                    <p className="text-zinc-400 mt-4">{appointment.email}</p>

                    <p className="text-zinc-400">{appointment.phone}</p>
                  </div>

                  {/* APPOINTMENT */}
                  <div>
                    <p className="text-zinc-500 text-sm">Appointment</p>

                    <div className="space-y-2 mt-4 text-zinc-300">
                      <p>Service: {appointment.service}</p>

                      <p>Barber: {appointment.barber}</p>

                      <p>Date: {appointment.appointment_date}</p>

                      <p>Time: {appointment.appointment_time}</p>
                    </div>
                  </div>
                </div>

                {/* DELETE BUTTON */}
                <button
                  onClick={() => deleteAppointment(appointment.id)}
                  className="mt-8 bg-red-500 text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
                >
                  Delete Appointment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
