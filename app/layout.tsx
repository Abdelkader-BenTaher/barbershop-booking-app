import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Fade Studio",
  description: "Premium barber booking platform",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <Toaster position="top-right" />

        <Navbar />

        {children}
      </body>
    </html>
  );
}
