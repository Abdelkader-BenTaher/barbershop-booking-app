"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const services = [
  {
    title: "Classic Haircut",
    description: "Precision cuts tailored to your style.",
  },
  {
    title: "Beard Trim",
    description: "Sharp beard shaping and detailing.",
  },
  {
    title: "Full Grooming",
    description: "Complete premium barber experience.",
  },
];

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setLoggedIn(!!user);
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="bg-black text-white">
      {/* Hero */}
      <section className="min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <p className="text-zinc-400 uppercase tracking-[0.3em] mb-6">
              Premium Barber Studio
            </p>

            <h1 className="text-6xl md:text-8xl font-bold leading-tight">
              Modern Cuts.
              <br />
              Timeless Style.
            </h1>

            <p className="text-zinc-400 text-lg mt-8 max-w-xl leading-relaxed">
              Experience luxury grooming with expert barbers, premium service,
              and effortless online booking.
            </p>

            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                href="/booking"
                className="bg-white text-black px-8 py-4 rounded-2xl font-semibold hover:scale-105 transition"
              >
                Book Appointment
              </Link>

              {!loggedIn && (
                <Link
                  href="/register"
                  className="border border-zinc-700 px-8 py-4 rounded-2xl hover:bg-zinc-900 transition"
                >
                  Create Account
                </Link>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-zinc-800">
              <img
                src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1200&auto=format&fit=crop"
                alt="Barber"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-32 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-zinc-400 uppercase tracking-[0.3em] mb-4">
              Services
            </p>

            <h2 className="text-5xl font-bold">Premium Grooming</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition"
              >
                <h3 className="text-3xl font-bold">{service.title}</h3>

                <p className="text-zinc-400 mt-6 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-zinc-400 uppercase tracking-[0.3em] mb-6">
            Book Today
          </p>

          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            Elevate Your Grooming Experience
          </h2>

          <p className="text-zinc-400 text-lg mt-8 leading-relaxed">
            Join clients who trust Fade Studio for modern cuts, beard styling,
            and premium barber care.
          </p>

          <Link
            href="/booking"
            className="inline-block mt-10 bg-white text-black px-10 py-5 rounded-2xl font-bold hover:scale-105 transition"
          >
            Schedule Appointment
          </Link>
        </div>
      </section>
    </main>
  );
}
