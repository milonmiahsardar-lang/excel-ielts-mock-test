"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

export default function PartNavigation({ current, total, onChange, floating = false }: {
  current: number;
  total: number;
  onChange: (part: number) => void;
  floating?: boolean;
}) {
  return <div className={floating ? "relative z-30 h-0 shrink-0" : "flex shrink-0 justify-end bg-white px-5 py-2"}>
    <nav aria-label="Test part navigation" className={floating ? "absolute bottom-2 right-5 flex gap-1" : "flex gap-1"}>
      <button type="button" aria-label="Previous part" title="Previous part" disabled={current <= 1}
        onClick={() => onChange(current - 1)}
        className="flex h-14 w-14 items-center justify-center rounded-sm bg-black text-white disabled:cursor-default disabled:bg-[#ddd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2185d0]">
        <ArrowLeft size={32} strokeWidth={3} />
      </button>
      <button type="button" aria-label="Next part" title="Next part" disabled={current >= total}
        onClick={() => onChange(current + 1)}
        className="flex h-14 w-14 items-center justify-center rounded-sm bg-black text-white disabled:cursor-default disabled:bg-[#ddd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2185d0]">
        <ArrowRight size={32} strokeWidth={3} />
      </button>
    </nav>
  </div>;
}
