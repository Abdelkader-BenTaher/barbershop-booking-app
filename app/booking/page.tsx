"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { fetchProfile, getBrowserSessionUser } from "@/lib/auth";

const services = ["Classic Haircut", "Beard Trim", "Full Grooming"];

const times = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];

type Barber = {
  id: string;
  name: string;
  working_days: string[];
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

export default function BookingPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);

  const [selectedTime, setSelectedTime] = useState("");

  const [availableTimes, setAvailableTimes] = useState(times);

  const [loading, setLoading] = useState(false);

  const [barberUnavailable, setBarberUnavailable] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    service: services[0],
    barber: "",
    appointment_date: "",
  });

  useEffect(() => {
    loadProfile();
    fetchBarbers();
  }, []);

  useEffect(() => {
    checkBarberAvailability();
    fetchAvailableTimes();
  }, [formData.barber, formData.appointment_date]);

  async function fetchBarbers() {
    const { data, error } = await supabase.from("barbers").select("*");

    if (error) {
      toast.error("Failed to load barbers");
      return;
    }

    const normalizedBarbers = (data || []).map(normalizeBarber);
    setBarbers(normalizedBarbers);

    if (normalizedBarbers.length > 0) {
      setFormData((prev) => ({
        ...prev,
        barber: normalizedBarbers[0].name,
      }));
    }
  }

  async function loadProfile() {
    try {
      const user = await getBrowserSessionUser();

      if (!user) return;

      const profile = await fetchProfile(user);

      setFormData((prev) => ({
        ...prev,
        full_name: profile?.full_name || "",
        phone: profile?.phone || "",
        email: user.email || "",
      }));
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  function checkBarberAvailability() {
    if (!formData.barber || !formData.appointment_date) {
      return;
    }

    const selectedBarber = barbers.find(
      (barber) => barber.name === formData.barber,
    );

    if (!selectedBarber) return;

    const date = new Date(formData.appointment_date);

    const dayName = date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const isWorkingDay = selectedBarber.working_days.includes(dayName);

    setBarberUnavailable(!isWorkingDay);

    if (!isWorkingDay) {
      setAvailableTimes([]);
    }
  }

  async function fetchAvailableTimes() {
    if (!formData.appointment_date || barberUnavailable) {
      return;
    }

    const { data } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("barber", formData.barber)
      .eq("appointment_date", formData.appointment_date);

    const bookedTimes =
      data?.map((appointment) => appointment.appointment_time) || [];

    const filteredTimes = times.filter((time) => !bookedTimes.includes(time));

    setAvailableTimes(filteredTimes);
  }

  async function handleBooking() {
    if (barberUnavailable) {
      toast.error("This barber is unavailable on this day");

      return;
    }

    if (!selectedTime) {
      toast.error("Please select a time slot");
      return;
    }

    if (!formData.appointment_date) {
      toast.error("Please select a date");
      return;
    }

    if (!formData.full_name || !formData.phone || !formData.email) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    let user: User | null = null;

    try {
      user = await getBrowserSessionUser();
    } catch (error) {
      console.error("Failed to load auth session", error);
    }

    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("*")
      .eq("barber", formData.barber)
      .eq("appointment_date", formData.appointment_date)
      .eq("appointment_time", selectedTime)
      .single();

    if (existingAppointment) {
      setLoading(false);

      toast.error("This time slot is already booked.");

      return;
    }

    const { error } = await supabase.from("appointments").insert([
      {
        ...formData,
        appointment_time: selectedTime,
        user_id: user?.id,
      },
    ]);

    setLoading(false);

    if (error) {
      console.log(error);

      toast.error("Booking failed");

      return;
    }

    toast.success("Appointment booked successfully!");

    fetchAvailableTimes();

    setSelectedTime("");

    setFormData((prev) => ({
      ...prev,
      service: services[0],
      appointment_date: "",
    }));
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold text-center">Book Appointment</h1>

        <p className="text-zinc-400 text-center mt-4">
          Schedule your next premium grooming session.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-12">
          {/* Service */}
          <div className="mb-6">
            <label className="block mb-3 text-sm text-zinc-400">
              Select Service
            </label>

            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            >
              {services.map((service, index) => (
                <option key={index}>{service}</option>
              ))}
            </select>
          </div>

          {/* Barber */}
          <div className="mb-6">
            <label className="block mb-3 text-sm text-zinc-400">
              Choose Barber
            </label>

            <select
              name="barber"
              value={formData.barber}
              onChange={handleChange}
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            >
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.name}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="mb-6">
            <label className="block mb-3 text-sm text-zinc-400">
              Appointment Date
            </label>

            <input
              type="date"
              name="appointment_date"
              value={formData.appointment_date}
              onChange={handleChange}
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />
          </div>

          {/* Availability Warning */}
          {barberUnavailable && (
            <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 rounded-xl p-4">
              This barber is unavailable on the selected day.
            </div>
          )}

          {/* Time Slots */}
          <div className="mb-8">
            <label className="block mb-4 text-sm text-zinc-400">
              Available Time Slots
            </label>

            {availableTimes.length === 0 ? (
              <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-xl p-4">
                No available slots for this date.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableTimes.map((time) => (
                  <button
                    type="button"
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 rounded-xl border transition ${
                      selectedTime === time
                        ? "bg-white text-black border-white"
                        : "border-zinc-700 hover:bg-zinc-800"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="space-y-6">
            <div>
              <label className="block mb-3 text-sm text-zinc-400">
                Full Name
              </label>

              <input
                type="text"
                name="full_name"
                value={formData.full_name}
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
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="block mb-3 text-sm text-zinc-400">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleBooking}
            disabled={loading}
            className="w-full mt-10 bg-white text-black py-4 rounded-2xl font-bold hover:scale-[1.02] transition disabled:opacity-50"
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </main>
  );
}
