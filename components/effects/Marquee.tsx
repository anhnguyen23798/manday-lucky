import { copy } from "@/lib/copy";

export function Marquee({ items = copy.marquee }: { items?: readonly string[] }) {
  const list = [...items, ...items];
  return (
    <div className="hazard relative z-10 overflow-hidden border-y-4 border-ink" aria-hidden>
      <div className="flex w-max animate-marquee gap-12 py-2 pl-12 font-display text-lg text-ink md:text-xl">
        {list.map((j, i) => (
          <span key={i} className="whitespace-nowrap">
            🥸 {j}
          </span>
        ))}
      </div>
    </div>
  );
}
