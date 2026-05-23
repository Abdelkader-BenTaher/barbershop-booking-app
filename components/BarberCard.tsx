type Props = {
  name: string;
  specialty: string;
};

export default function BarberCard({ name, specialty }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
      <div className="h-72 bg-zinc-800" />

      <div className="p-6">
        <h4 className="text-2xl font-semibold">{name}</h4>

        <p className="text-zinc-400 mt-2">{specialty}</p>

        <button className="mt-6 w-full border border-zinc-700 py-3 rounded-xl hover:bg-zinc-800 transition">
          View Profile
        </button>
      </div>
    </div>
  );
}
