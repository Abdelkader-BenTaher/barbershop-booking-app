import { Clock, Star } from "lucide-react";

type Props = {
  title: string;
  price: string;
  time: string;
};

export default function ServiceCard({ title, price, time }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:border-white transition">
      <div className="flex items-center justify-between">
        <Star />
        <span className="text-2xl font-bold">{price}</span>
      </div>

      <h4 className="text-2xl font-semibold mt-8">{title}</h4>

      <div className="flex items-center gap-2 text-zinc-400 mt-4">
        <Clock size={18} />
        <span>{time}</span>
      </div>

      <button className="w-full mt-8 bg-white text-black py-3 rounded-xl font-semibold hover:scale-105 transition">
        Book Appointment
      </button>
    </div>
  );
}
