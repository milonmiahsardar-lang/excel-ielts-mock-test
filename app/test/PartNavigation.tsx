"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

export default function PartNavigation({ current, total, onChange }: {
  current: number;
  total: number;
  onChange: (part: number) => void;
}) {
  return <div className="relative z-30 h-0 shrink-0">
    <nav aria-label="Test part navigation" className="absolute bottom-5 right-5 flex gap-1">
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
