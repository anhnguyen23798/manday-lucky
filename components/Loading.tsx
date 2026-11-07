import { Sticker } from "./ui/Sticker";

export function Loading({ text = "Đang cạo râu cho vòng quay…" }: { text?: string }) {
  return (
    <div role="status" className="grid flex-1 place-items-center p-10">
      <div className="flex flex-col items-center gap-4">
        <Sticker emoji="🪒" size={80} tilt={-10} className="animate-wiggle" />
        <p className="font-rounded text-xl font-extrabold">{text}</p>
      </div>
    </div>
  );
}
