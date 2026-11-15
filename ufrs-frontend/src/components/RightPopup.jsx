import { X, Settings, Globe, Map, ShieldCheck, Activity, Layers } from "lucide-react";
import { useAppStore } from "../stores/useAppStore";

export default function RightPopup() {
  const stepIndex = useAppStore((state) => state.stepIndex);
  const showHarmonizedLayer = useAppStore((state) => state.showHarmonizedLayer);
  const isRightCollapsed = useAppStore((state) => state.isRightCollapsed);
  const setRightCollapsed = useAppStore((state) => state.setRightCollapsed);
  const activeView = useAppStore((state) => state.activeView) || "harmonized";

  const projectionMode = useAppStore((state) => state.projectionMode);
  const setProjectionMode = useAppStore((state) => state.setProjectionMode);

  const apiData = useAppStore((state) => state.apiData);
  const getActiveSlot = useAppStore((state) => state.getActiveSlot);

  const activeSlot = getActiveSlot();
  const meta = apiData?.meta;

  // If collapsed, render as a floating trigger button in the map area
  if (isRightCollapsed) {
    return (
      <div className="absolute top-2.5 right-2.5 z-20">
        <button
          type="button"
          onClick={() => setRightCollapsed(false)}
          className="flex h-8 w-8 items-center justify-center rounded border border-[#383838] bg-[#1a1a1a]/90 backdrop-blur-xs text-amber-400 shadow-xl hover:border-amber-500/60 hover:bg-[#252526] hover:text-amber-300 transition-all cursor-pointer group"
          title="Open Overpass & View Settings"
          aria-label="Open Settings"
        >
          <Settings className="h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-2.5 right-2.5 z-20 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100%-1.5rem)] flex flex-col justify-between rounded-lg border border-[#383838] bg-[#1c1c1c]/95 backdrop-blur-md p-3 text-xs shadow-2xl select-none overflow-y-auto">
      <div className="space-y-2.5">
        {/* Top Bar: Title & Close Button */}
        <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
            <Activity className="h-3.5 w-3.5" />
            <span>OVERPASS TELEMETRY</span>
          </div>
          <button
            type="button"
            onClick={() => setRightCollapsed(true)}
            className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-[#2e2e2e] hover:text-white transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 2D Map / 3D Globe Projection Selector */}
        <div className="space-y-1.5 rounded border border-[#333333] bg-[#181818] p-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-200">VIEW PROJECTION</span>
            <span className="text-[10px] text-amber-400 font-mono">Zoom retained</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setProjectionMode("globe")}
              className={`flex items-center justify-center gap-1.5 rounded py-1 text-[11px] font-semibold transition-all cursor-pointer border ${
                projectionMode === "globe"
                  ? "border-amber-400 bg-amber-500/20 text-amber-400"
                  : "border-[#333] bg-[#222] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>3D Globe</span>
            </button>
            <button
              type="button"
              onClick={() => setProjectionMode("mercator")}
              className={`flex items-center justify-center gap-1.5 rounded py-1 text-[11px] font-semibold transition-all cursor-pointer border ${
                projectionMode === "mercator"
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-400"
                  : "border-[#333] bg-[#222] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Map className="h-3.5 w-3.5" />
              <span>2D Map</span>
            </button>
          </div>
        </div>

        {/* Active Overpass Slot Summary Card */}
        <div className="space-y-1.5 rounded border border-[#333333] bg-[#181818] p-2.5 text-[11px]">
          <div className="flex items-center justify-between border-b border-[#262626] pb-1 mb-1">
            <span className="font-bold text-zinc-200">PASS WINDOW</span>
            <span className="font-semibold text-amber-400 font-mono">
              {activeSlot.label || `${activeSlot.date} (${activeSlot.period_label || activeSlot.period})`}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Merged 1.0 km Hotspots:</span>
            <span className="font-mono text-zinc-100 font-semibold">
              {activeSlot.harmonized_count ?? 0} events
              {activeSlot.raw_count != null && (
                <span className="text-zinc-500 font-normal ml-1">
                  (from {activeSlot.raw_count} raw)
                </span>
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Calibrated Total FRP:</span>
            <span className="text-orange-400 font-semibold font-mono">
              {(activeSlot.total_frp_mw || 0).toLocaleString()} MW
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Persistent (Day + Night):</span>
            <span className="text-[#00f5d4] font-semibold font-mono">
              {activeSlot.persistent_count ?? 0} events
            </span>
          </div>

          {/* Diurnal Persistence Ring Legend (Notebook Specification) */}
          <div className="flex items-center justify-between border-t border-[#2a2a2a] pt-1.5 text-[9.5px]">
            <span className="flex items-center gap-1 text-[#00f5d4]" title="Burned across both day and night passes">
              <span className="inline-block h-2 w-2 rounded-full border border-[#00f5d4] bg-[#00f5d4]/40" />
              Persistent
            </span>
            <span className="flex items-center gap-1 text-[#f59e0b]" title="Detected during day pass only">
              <span className="inline-block h-2 w-2 rounded-full border border-[#f59e0b] bg-[#f59e0b]/40" />
              Day Only
            </span>
            <span className="flex items-center gap-1 text-[#7aa2f7]" title="Detected during night pass only">
              <span className="inline-block h-2 w-2 rounded-full border border-[#7aa2f7] bg-[#7aa2f7]/40" />
              Night Only
            </span>
          </div>

          <div className="flex justify-between border-t border-[#2a2a2a] pt-1 mt-1 text-[10.5px]">
            <span className="text-zinc-500">View Rendering:</span>
            <span
              className={
                activeView === "comparison"
                  ? "text-amber-400 font-medium"
                  : showHarmonizedLayer
                  ? "text-emerald-400 font-medium"
                  : "text-zinc-400"
              }
            >
              {activeView === "comparison"
                ? "Raw vs 1.0 km Comparison"
                : showHarmonizedLayer
                ? "1.0 km Clustered (Harmonized)"
                : "Raw Sensor Pixels"}
            </span>
          </div>
        </div>

        {/* 10-Day Window Regional Synthesis (from Meta) */}
        {meta && (
          <div className="space-y-1.5 rounded border border-[#333333] bg-[#181818] p-2.5 text-[11px]">
            <div className="flex items-center gap-1 font-bold text-zinc-200 border-b border-[#262626] pb-1 mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>10-DAY RECONNAISSANCE AUDIT</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Spatial Compression:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {meta.compression_ratio}x ({meta.total_harmonized_events} from {meta.total_raw_detections} raw)
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Calibrated FRP:</span>
              <span className="font-mono text-orange-400">
                {meta.calibrated_total_frp_mw?.toLocaleString()} MW
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Multi-Sensor Corroboration:</span>
              <span className="font-mono text-zinc-200">
                {meta.multi_sensor_pct}% (≥2 sensors)
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Day + Night Persistence:</span>
              <span className="font-mono text-[#00f5d4]">
                {meta.persistent_events_pct}% ({meta.persistent_events_count} cells)
              </span>
            </div>
          </div>
        )}

        {/* Operational Guidance */}
        <div className="rounded border border-[#333333] bg-[#181818] p-2 text-[10px] text-zinc-400 space-y-0.5">
          <div className="text-zinc-300 font-semibold mb-0.5">CONTROLS &amp; SHORTCUTS</div>
          <p>• Left-drag to pan / rotate globe</p>
          <p>• Scroll to zoom in / out</p>
          <p>• Right-drag to tilt 3D perspective pitch</p>
          <p>• Click any fire marker for full intelligence popup</p>
        </div>
      </div>

      <div className="mt-2 rounded border border-amber-500/20 bg-amber-500/5 p-1 text-[9.5px] text-amber-300/80 text-center">
        NASA FIRMS MODIS &amp; VIIRS NOAA-20/21 Harmonized
      </div>
    </div>
  );
}
