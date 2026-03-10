"use client";

interface HoverTooltipProps {
  name: string;
  x: number;
  y: number;
}

export default function HoverTooltip({ name, x, y }: HoverTooltipProps) {
  return (
    <div
      style={{ left: x + 12, top: y - 8 }}
      className="pointer-events-none fixed z-50 rounded-none border border-[#ff6b35] bg-[#0d0400]/90 px-3 py-1 font-pixel text-xs text-[#ff6b35]"
    >
      {name}
    </div>
  );
}
