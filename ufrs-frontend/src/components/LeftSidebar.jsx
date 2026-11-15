import { useState } from "react";
import {
  MapPin,
  RotateCcw,
  Radio,
  Layers,
  Plus,
  Trash2,
  Calendar,
  Download,
  RefreshCw,
  Flame,
  Mountain,
  Factory,
  Anchor,
  Crosshair,
} from "lucide-react";
import { useAppStore, DEFAULT_VIEW_STATE } from "../stores/useAppStore";

const PRESET_COORDS = [
  { name: "Park Fire", lat: 39.91, lon: -121.823, zoom: 8.5, targetDate: "2024-07-26" },
  { name: "India", lat: 30.9, lon: 75.85, zoom: 6.5, targetDate: "2024-11-01" },
  { name: "Amazon", lat: -9.0, lon: -63.0, zoom: 6.0, targetDate: "2024-08-20" },
];

export default function LeftSidebar() {
  const viewState = useAppStore((state) => state.viewState);
  const setViewState = useAppStore((state) => state.setViewState);
  const resetCamera = useAppStore((state) => state.resetCamera);
  const sensorFilters = useAppStore((state) => state.sensorFilters);
  const toggleSensor = useAppStore((state) => state.toggleSensor);
  const categoryFilters = useAppStore((state) => state.categoryFilters);
  const toggleCategory = useAppStore((state) => state.toggleCategory);

  const pinnedLocation = useAppStore((state) => state.pinnedLocation);
  const setPinnedLocation = useAppStore((state) => state.setPinnedLocation);
  const clearPinnedLocation = useAppStore((state) => state.clearPinnedLocation);
  const manualCoords = useAppStore((state) => state.manualCoords) || {
    lat: "39.910",
    lon: "-121.823",
    zoom: "8.5",
  };
  const setManualCoords = useAppStore((state) => state.setManualCoords);

  const targetDate = useAppStore((state) => state.targetDate);
  const setTargetDate = useAppStore((state) => state.setTargetDate);
  const radiusKm = useAppStore((state) => state.radiusKm);
  const setRadiusKm = useAppStore((state) => state.setRadiusKm);

  const selectedBbox = useAppStore((state) => state.selectedBbox);
  const clearSelectedBbox = useAppStore((state) => state.clearSelectedBbox);
  const isDrawingBbox = useAppStore((state) => state.isDrawingBbox);
  const setIsDrawingBbox = useAppStore((state) => state.setIsDrawingBbox);

  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);
  const fetchFireData = useAppStore((state) => state.fetchFireData);
  const exportHarmonizedCsv = useAppStore((state) => state.exportHarmonizedCsv);

  // Sync inputs with current live camera view or active dropped pin
  const handleSyncCurrent = () => {
    const target = pinnedLocation || viewState;
    if (target) {
      setManualCoords({
        lat: target.latitude.toFixed(3),
        lon: target.longitude.toFixed(3),
        zoom: viewState ? viewState.zoom.toFixed(1) : manualCoords.zoom,
      });
    }
  };

  // Fly/Navigate map to entered coordinates and drop pin marker
  const handleFlyTo = (e) => {
    e?.preventDefault();
    const lat = parseFloat(manualCoords.lat);
    const lon = parseFloat(manualCoords.lon);
    const zoom = parseFloat(manualCoords.zoom);

    if (!isNaN(lat) && !isNaN(lon)) {
      const sanitizedLat = Math.max(-90, Math.min(90, lat));
      const sanitizedLon = ((((lon + 180) % 360) + 360) % 360) - 180;
      setPinnedLocation({ latitude: sanitizedLat, longitude: sanitizedLon });
      setViewState({
        latitude: sanitizedLat,
        longitude: sanitizedLon,
        zoom: !isNaN(zoom) ? Math.max(1, Math.min(18, zoom)) : 8.5,
      });
      fetchFireData({ lat: sanitizedLat, lon: sanitizedLon });
    }
  };

  // Quick preset loader
  const handlePreset = (preset) => {
    setPinnedLocation({ latitude: preset.lat, longitude: preset.lon });
    setManualCoords({
      lat: preset.lat.toFixed(3),
      lon: preset.lon.toFixed(3),
      zoom: preset.zoom.toFixed(1),
    });
    setViewState({
      latitude: preset.lat,
      longitude: preset.lon,
      zoom: preset.zoom,
    });
    setTargetDate(preset.targetDate);
    clearSelectedBbox();
    fetchFireData({
      lat: preset.lat,
      lon: preset.lon,
      targetDate: preset.targetDate,
      bbox: null,
    });
  };

  return (
    <aside className="flex h-full flex-col justify-between bg-[#222222] p-3 text-xs select-none overflow-y-auto">
      <div className="space-y-3.5 min-w-0">
        {/* SECTION 1: HORIZONTAL SENSOR SOURCE FILTERS */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
            <Radio className="h-3.5 w-3.5 text-amber-400" />
            <span>SENSOR SOURCES</span>
          </div>

          {/* Horizontal side-by-side buttons */}
          <div className="grid grid-cols-3 gap-1.5 min-w-0">
            {[
              { key: "modis", label: "MODIS", res: "1000m" },
              { key: "viirs20", label: "NOAA-20", res: "375m" },
              { key: "viirs21", label: "NOAA-21", res: "375m" },
            ].map((sensor) => {
              const active = Boolean(sensorFilters?.[sensor.key]);
              return (
                <button
                  key={sensor.key}
                  type="button"
                  onClick={() => toggleSensor(sensor.key)}
                  className={`flex flex-col items-center justify-center rounded-md border p-1.5 transition-all cursor-pointer min-w-0 ${
                    active
                      ? "border-amber-400/80 bg-amber-500/15 text-amber-300 shadow-xs"
                      : "border-[#333333] bg-[#1a1a1a] text-zinc-500 hover:border-zinc-500"
                  }`}
                  title={`${sensor.label} (${sensor.res}) - Click to toggle`}
                >
                  <div className="flex items-center gap-1 font-semibold text-[11px] truncate">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        active ? "bg-amber-400" : "bg-zinc-600"
                      }`}
                    />
                    <span className="truncate">{sensor.label}</span>
                  </div>
                  <span className="text-[9.5px] opacity-75 font-mono">
                    {sensor.res}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: TARGET DATE & 10-DAY WINDOW FETCH */}
        <div className="space-y-2 rounded-md border border-[#333333] bg-[#191919] p-2.5 min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-zinc-200 text-[11px]">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span>RECONNAISSANCE WINDOW</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label
                htmlFor="target-date-input"
                className="block text-[10px] font-medium text-zinc-400 mb-0.5"
              >
                Target Date (D)
              </label>
              <input
                id="target-date-input"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded border border-[#383838] bg-[#121212] px-2 py-1 text-[11px] font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="radius-km-input"
                className="block text-[10px] font-medium text-zinc-400 mb-0.5"
              >
                Radius (km)
              </label>
              <input
                id="radius-km-input"
                type="number"
                min="10"
                max="300"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full rounded border border-[#383838] bg-[#121212] px-2 py-1 text-[11px] font-mono text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchFireData()}
            disabled={isLoading}
            className={`flex w-full items-center justify-center gap-1.5 rounded py-1.5 font-bold text-[11px] transition-all cursor-pointer ${
              isLoading
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-sm"
            }`}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-amber-300" : ""}`}
            />
            <span>{isLoading ? "Harmonizing Sensors..." : "Fetch 10-Day Fire Window"}</span>
          </button>

          {error && (
            <div className="rounded border border-red-500/40 bg-red-950/30 p-1.5 text-[10px] text-red-300">
              Error: {error}
            </div>
          )}
        </div>

        {/* SECTION 3: DRAG SELECTION CAPSULE (+ to arm drag, trash to delete) */}
        <div className="rounded-md border border-[#333333] bg-[#1a1a1a] p-2.5 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-zinc-200 text-[11px] font-medium tracking-tight">
              Drag Selection BBox
            </span>

            <div
              className={`flex items-center rounded-full border transition-all ${
                isDrawingBbox || selectedBbox
                  ? "border-red-500 bg-red-600/40 ring-1 ring-red-500/50"
                  : "border-red-500/60 bg-red-500/25"
              }`}
            >
              {/* Plus button to arm/create new selection */}
              <button
                type="button"
                onClick={() => setIsDrawingBbox(!isDrawingBbox)}
                className={`flex items-center justify-center px-2 py-1 rounded-l-full transition-colors cursor-pointer group ${
                  isDrawingBbox ? "bg-red-500/50 text-white" : "hover:bg-red-500/30 text-red-300"
                }`}
                title={isDrawingBbox ? "Drawing active — drag on map" : "Click to arm rectangular box drag"}
                aria-label="Toggle Box Selection"
              >
                <Plus className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              </button>

              {/* Middle Divider */}
              <div className="h-3.5 w-[1px] bg-red-500/50" />

              {/* Trash button to delete selection */}
              <button
                type="button"
                onClick={() => {
                  clearSelectedBbox();
                  setIsDrawingBbox(false);
                }}
                className="flex items-center justify-center px-2 py-1 hover:bg-red-500/30 rounded-r-full transition-colors cursor-pointer group text-red-400 hover:text-red-200"
                title="Clear bounding box selection"
                aria-label="Delete selection"
              >
                <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {isDrawingBbox && (
            <div className="text-[10px] text-red-400 font-mono animate-pulse">
              Click &amp; drag on globe/map to draw region box
            </div>
          )}

          {selectedBbox && (
            <div className="text-[9.5px] font-mono text-zinc-300 truncate bg-[#141414] px-1.5 py-0.5 rounded border border-[#333]">
              BBox: {selectedBbox.west.toFixed(2)}, {selectedBbox.south.toFixed(2)} →{" "}
              {selectedBbox.east.toFixed(2)}, {selectedBbox.north.toFixed(2)}
            </div>
          )}
        </div>

        {/* SECTION 4: SOURCE TYPE & FIRE BEHAVIOR FILTERS */}
        <div className="space-y-1.5 rounded-md border border-[#333333] bg-[#191919] p-2.5 min-w-0">
          <div className="flex items-center justify-between pb-1 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-1.5 font-bold text-zinc-200 text-[11px]">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>SOURCE TYPE FILTERS</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {[
              { key: "vegetation", label: "Vegetation", icon: Flame, color: "text-amber-400" },
              { key: "volcano", label: "Volcano", icon: Mountain, color: "text-red-400" },
              { key: "staticIndustrial", label: "Industrial", icon: Factory, color: "text-purple-400" },
              { key: "offshore", label: "Offshore", icon: Anchor, color: "text-blue-400" },
            ].map((cat) => {
              const active = Boolean(categoryFilters?.[cat.key]);
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  className={`flex items-center gap-1.5 rounded px-2 py-1 text-[10.5px] border transition-colors cursor-pointer ${
                    active
                      ? "border-amber-500/60 bg-amber-500/15 text-zinc-200 font-medium"
                      : "border-[#303030] bg-[#141414] text-zinc-500"
                  }`}
                >
                  <Icon className={`h-3 w-3 ${active ? cat.color : "text-zinc-600"}`} />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: RESPONSIVE MANUAL COORDINATES INPUT */}
        <div className="@container space-y-2 rounded-md border border-[#333333] bg-[#191919] p-2.5 min-w-0">
          <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-1.5 min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-zinc-200 text-[11px] truncate">
              <Crosshair className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="truncate">MANUAL COORDINATES</span>
            </div>
            <button
              type="button"
              onClick={handleSyncCurrent}
              className="text-[10px] text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer shrink-0 ml-1"
              title="Sync fields to current map position"
            >
              Sync Current
            </button>
          </div>

          <form onSubmit={handleFlyTo} className="space-y-2 pt-1 min-w-0">
            {/* Latitude and Longitude */}
            <div className="grid grid-cols-1 @[210px]:grid-cols-2 gap-1.5 min-w-0">
              <div className="min-w-0">
                <label
                  htmlFor="input-lat"
                  className="block text-[10px] font-medium text-zinc-400 mb-0.5 truncate"
                  title="Latitude (°N)"
                >
                  Latitude (°N)
                </label>
                <input
                  id="input-lat"
                  type="number"
                  step="any"
                  value={manualCoords.lat}
                  onChange={(e) => setManualCoords({ lat: e.target.value })}
                  className="w-full min-w-0 rounded border border-[#383838] bg-[#121212] px-2 py-1 text-[11px] font-mono text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="39.910"
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="input-lon"
                  className="block text-[10px] font-medium text-zinc-400 mb-0.5 truncate"
                  title="Longitude (°E)"
                >
                  Longitude (°E)
                </label>
                <input
                  id="input-lon"
                  type="number"
                  step="any"
                  value={manualCoords.lon}
                  onChange={(e) => setManualCoords({ lon: e.target.value })}
                  className="w-full min-w-0 rounded border border-[#383838] bg-[#121212] px-2 py-1 text-[11px] font-mono text-zinc-100 placeholder-zinc-600 focus:border-amber-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="-121.823"
                />
              </div>
            </div>

            {/* Action Buttons: Navigate / Fly To and Reset */}
            <div className="flex gap-1.5 pt-1 min-w-0">
              <button
                type="submit"
                className="flex flex-1 min-w-0 items-center justify-center gap-1.5 rounded bg-amber-500 py-1.5 font-bold text-zinc-950 hover:bg-amber-400 transition-colors cursor-pointer text-[11px]"
                title="Fly map camera to entered coordinates, drop pin and fetch fire data"
              >
                <MapPin className="h-3 w-3 fill-current shrink-0" />
                <span className="truncate">Drop Pin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetCamera();
                  setPinnedLocation({
                    latitude: DEFAULT_VIEW_STATE.latitude,
                    longitude: DEFAULT_VIEW_STATE.longitude,
                  });
                  setManualCoords({
                    lat: DEFAULT_VIEW_STATE.latitude.toFixed(3),
                    lon: DEFAULT_VIEW_STATE.longitude.toFixed(3),
                    zoom: DEFAULT_VIEW_STATE.zoom.toFixed(1),
                  });
                }}
                className="flex items-center justify-center gap-1 rounded border border-[#383838] bg-[#222222] px-2.5 py-1.5 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer text-[11px] shrink-0"
                title="Reset to default coordinates"
              >
                <RotateCcw className="h-3 w-3 shrink-0" />
                <span>Reset</span>
              </button>
            </div>

            {/* Pinned Marker Status */}
            {pinnedLocation && (
              <div className="flex items-center justify-between pt-1 border-t border-[#2a2a2a] text-[10px]">
                <span className="text-amber-400/90 flex items-center gap-1 font-mono truncate mr-1">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">
                    Pin: {pinnedLocation.latitude.toFixed(3)}°,{" "}
                    {pinnedLocation.longitude.toFixed(3)}°
                  </span>
                </span>
                <button
                  type="button"
                  onClick={clearPinnedLocation}
                  className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                  title="Remove target pin marker"
                >
                  Clear Pin
                </button>
              </div>
            )}
          </form>

          {/* Quick Presets */}
          <div className="pt-1 border-t border-[#2a2a2a] min-w-0">
            <span className="text-[9.5px] text-zinc-500 block mb-1">
              Quick Region Presets:
            </span>
            <div className="flex flex-wrap gap-1">
              {PRESET_COORDS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className="rounded border border-[#333333] bg-[#1c1c1c] px-2 py-0.5 text-[10px] text-zinc-300 hover:border-amber-500/50 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: EXPORT HARMONIZED CSV & FOOTER */}
      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={exportHarmonizedCsv}
          className="flex w-full items-center justify-center gap-1.5 rounded border border-amber-500/60 bg-amber-500/20 py-2 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 transition-colors cursor-pointer shadow-xs"
          title="Download the full 16-column Stage 4 Harmonized Fire Hotspots CSV"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Harmonized CSV</span>
        </button>

        <div className="rounded border border-[#2f2f2f] bg-[#1a1a1a] p-2 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1 text-zinc-400 font-semibold mb-0.5">
            <Layers className="h-3 w-3 text-amber-400" />
            <span>4-Stage Multi-Sensor Harmonizer</span>
          </div>
          MODIS 1000m + VIIRS 375m NOAA-20/21 clustered into calibrated 1.0 km fire events.
        </div>
      </div>
    </aside>
  );
}
