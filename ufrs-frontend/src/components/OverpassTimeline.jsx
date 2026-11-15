import { useState, useEffect, useRef } from "react";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useAppStore,
  OVERPASS_SLOTS as STORE_SLOTS,
} from "../stores/useAppStore";

export default function OverpassTimeline({
  slots: propSlots,
  stepIndex: propStepIndex,
  onStepChange: propOnStepChange,
}) {
  const storeStepIndex = useAppStore((state) => state.stepIndex);
  const storeSetStepIndex = useAppStore((state) => state.setStepIndex);
  const apiSlots = useAppStore((state) => state.apiData?.slots);

  const slots = propSlots || (apiSlots && apiSlots.length > 0 ? apiSlots : STORE_SLOTS);
  const stepIndex = propStepIndex !== undefined ? propStepIndex : storeStepIndex;
  const onStepChange = propOnStepChange || storeSetStepIndex;

  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  const activeSlot = slots[stepIndex] || slots[0] || {};

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        onStepChange((prev) => (prev + 1) % slots.length);
      }, 1500);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, slots.length, onStepChange]);

  // Group slots into dates so each date column shows its Day (☀️) and Night (🌙) ticks
  const dates = [];
  for (let i = 0; i < slots.length; i += 2) {
    const sDay = slots[i];
    const sNight = slots[i + 1];
    if (sDay) {
      dates.push({
        dateLabel: sDay.date ? sDay.date.slice(5) : `D${i / 2 + 1}`,
        fullDate: sDay.date || "",
        dayIdx: i,
        nightIdx: i + 1,
        dayHarmCount: sDay.harmonized_count ?? 0,
        nightHarmCount: sNight?.harmonized_count ?? 0,
      });
    }
  }

  const isDay = activeSlot.day_night === "D" || activeSlot.period === "Day" || activeSlot.period_label === "Day";

  return (
    <footer className="flex h-32 w-screen shrink-0 flex-col justify-between bg-[#181818] border-t border-[#2a2a2a] px-5 py-2.5 text-xs select-none z-20">
      {/* Top Row: Title, Playback Controls, Active Readout */}
      <div className="flex items-center justify-between min-w-0 gap-4">
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#3e3529] bg-[#222] text-amber-400 hover:bg-[#2a2a2a] hover:border-amber-400 transition-colors cursor-pointer"
            title={isPlaying ? "Pause Timeline Scrubber" : "Play Timeline Scrubber"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
          </button>

          {/* Previous / Next Step Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#333] bg-[#1d1d1d] text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Overpass"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onStepChange(Math.min(slots.length - 1, stepIndex + 1))}
              disabled={stepIndex >= slots.length - 1}
              className="flex h-6 w-6 items-center justify-center rounded border border-[#333] bg-[#1d1d1d] text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next Overpass"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="hidden sm:inline text-zinc-400 text-[11px] font-mono">
            Chronological Overpass Timeline (10-Day Window)
          </span>
        </div>

        {/* Live Active Pass Badge */}
        <div className="flex items-center gap-2 font-mono">
          <div className="rounded border border-[#383838] bg-[#1c1c1c] px-2 py-0.5 text-zinc-300 text-[11px]">
            {activeSlot.date}
          </div>
          <div
            className={`rounded px-2 py-0.5 text-[11px] font-bold border ${
              isDay
                ? "border-amber-500/60 bg-amber-500/20 text-amber-300"
                : "border-[#7aa2f7]/60 bg-[#7aa2f7]/20 text-[#7aa2f7]"
            }`}
          >
            {isDay ? "☀️ Daytime Pass (~13:30 LST)" : "🌙 Nighttime Pass (~01:30 LST)"}
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10.5px] text-zinc-400">
            <span>
              <span className="text-zinc-500">Events:</span>{" "}
              <strong className="text-zinc-200">{activeSlot.harmonized_count ?? 0}</strong>
            </span>
            <span>·</span>
            <span>
              <span className="text-zinc-500">FRP:</span>{" "}
              <strong className="text-orange-400 font-semibold">
                {(activeSlot.total_frp_mw || 0).toLocaleString()} MW
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Scrubbing Slider */}
      <div className="relative w-full py-1">
        <input
          type="range"
          min={0}
          max={Math.max(1, slots.length - 1)}
          step={1}
          value={stepIndex}
          onChange={(e) => onStepChange(Number(e.target.value))}
          className="w-full cursor-pointer accent-amber-400 h-1.5 bg-[#333333] rounded-lg"
        />
      </div>

      {/* Bottom Date + Day/Night Markers */}
      <div className="flex items-center justify-between px-1 text-[10px] font-mono">
        {dates.map((d) => {
          const isDayActive = stepIndex === d.dayIdx;
          const isNightActive = stepIndex === d.nightIdx;
          const isDateActive = isDayActive || isNightActive;

          return (
            <div key={d.fullDate || d.dayIdx} className="flex flex-col items-center">
              <span
                className={`text-[9.5px] font-medium transition-colors ${
                  isDateActive ? "text-amber-400 font-bold" : "text-zinc-500"
                }`}
              >
                {d.dateLabel}
              </span>

              <div className="flex items-center gap-1.5 mt-0.5">
                {/* Daytime Tick Button */}
                <button
                  type="button"
                  onClick={() => onStepChange(d.dayIdx)}
                  title={`${d.fullDate} Daytime Pass (${d.dayHarmCount} events)`}
                  className={`flex h-4 w-4 items-center justify-center rounded transition-all cursor-pointer ${
                    isDayActive
                      ? "bg-amber-500/30 text-amber-300 font-bold ring-1 ring-amber-400 scale-110"
                      : "text-zinc-500 hover:text-amber-300 hover:bg-[#252525]"
                  }`}
                >
                  ☀️
                </button>

                {/* Nighttime Tick Button */}
                <button
                  type="button"
                  onClick={() => onStepChange(d.nightIdx)}
                  title={`${d.fullDate} Nighttime Pass (${d.nightHarmCount} events)`}
                  className={`flex h-4 w-4 items-center justify-center rounded transition-all cursor-pointer ${
                    isNightActive
                      ? "bg-[#7aa2f7]/30 text-[#7aa2f7] font-bold ring-1 ring-[#7aa2f7] scale-110"
                      : "text-zinc-500 hover:text-[#7aa2f7] hover:bg-[#252525]"
                  }`}
                >
                  🌙
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </footer>
  );
}
