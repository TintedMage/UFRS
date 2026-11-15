import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  Marker,
  Source,
  Layer,
  Popup,
} from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { Copy, Check, RotateCcw, X, Flame, Shield, Radio, Clock } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAppStore } from "../stores/useAppStore";

setWorkerUrl(maplibreWorkerUrl);

// Reliable, keyless raster basemap specifications for MapLibre 3D Globe
const BASEMAP_STYLES = {
  darkCanvas: {
    name: "Dark Gray",
    style: {
      version: 8,
      sources: {
        "esri-dark-base": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "Esri, DeLorme, NAVTEQ",
        },
        "esri-dark-ref": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: "esri-dark-base-layer",
          type: "raster",
          source: "esri-dark-base",
          minzoom: 0,
          maxzoom: 16,
        },
        {
          id: "esri-dark-ref-layer",
          type: "raster",
          source: "esri-dark-ref",
          minzoom: 0,
          maxzoom: 16,
        },
      ],
    },
    renderThumbnail: () => (
      <svg viewBox="0 0 44 44" className="h-full w-full">
        <rect width="44" height="44" fill="#14181f" />
        <line x1="0" y1="14" x2="44" y2="14" stroke="#252d38" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="0" y1="28" x2="44" y2="28" stroke="#252d38" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="22" y1="0" x2="22" y2="44" stroke="#252d38" strokeWidth="0.8" strokeDasharray="2 2" />
        <path
          d="M 6 36 C 10 28, 14 26, 22 28 C 30 30, 36 20, 38 12 C 40 8, 30 4, 24 8 C 18 12, 12 18, 6 22 Z"
          fill="#2b3340"
          stroke="#414d60"
          strokeWidth="1"
        />
        <circle cx="28" cy="18" r="1.5" fill="#f59e0b" />
      </svg>
    ),
  },
  satellite: {
    name: "Satellite",
    style: {
      version: 8,
      sources: {
        "esri-satellite": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "Esri, Maxar, Earthstar Geographics",
        },
      },
      layers: [
        {
          id: "esri-satellite-layer",
          type: "raster",
          source: "esri-satellite",
          minzoom: 0,
          maxzoom: 18,
        },
      ],
    },
    renderThumbnail: () => (
      <svg viewBox="0 0 44 44" className="h-full w-full">
        <rect width="44" height="44" fill="#0d233a" />
        <path d="M 4 40 C 12 32, 16 28, 24 30 C 32 32, 36 18, 42 14 L 44 44 L 0 44 Z" fill="#2d4a22" />
        <path d="M 8 36 C 14 26, 20 24, 28 26 C 34 27, 36 16, 40 12 C 34 6, 24 10, 18 16 C 12 22, 6 28, 8 36 Z" fill="#4a3c28" />
        <path d="M 2 12 Q 16 16 30 8 Q 38 12 42 6" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.45" fill="none" strokeLinecap="round" />
        <path d="M 10 24 Q 24 20 36 26" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.3" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
};

export default function HarmonizedGlobe({
  viewState: propViewState,
  onMove: propOnMove,
}) {
  const mapRef = useRef(null);

  const storeViewState = useAppStore((state) => state.viewState);
  const storeSetViewState = useAppStore((state) => state.setViewState);
  const storeResetCamera = useAppStore((state) => state.resetCamera);
  const activeBasemap = useAppStore((state) => state.activeBasemap);
  const setActiveBasemap = useAppStore((state) => state.setBasemap);
  const projectionMode = useAppStore((state) => state.projectionMode) || "globe";

  const pinnedLocation = useAppStore((state) => state.pinnedLocation);
  const setPinnedLocation = useAppStore((state) => state.setPinnedLocation);

  const stepIndex = useAppStore((state) => state.stepIndex);
  const targetDate = useAppStore((state) => state.targetDate);
  const sensorFilters = useAppStore((state) => state.sensorFilters);
  const categoryFilters = useAppStore((state) => state.categoryFilters);
  const showHarmonizedLayer = useAppStore((state) => state.showHarmonizedLayer);
  const showRawPixels = useAppStore((state) => state.showRawPixels);

  const apiData = useAppStore((state) => state.apiData);
  const fetchFireData = useAppStore((state) => state.fetchFireData);

  const selectedBbox = useAppStore((state) => state.selectedBbox);
  const setSelectedBbox = useAppStore((state) => state.setSelectedBbox);
  const isDrawingBbox = useAppStore((state) => state.isDrawingBbox);
  const setIsDrawingBbox = useAppStore((state) => state.setIsDrawingBbox);

  const viewState = propViewState || storeViewState;
  const onMove = propOnMove || storeSetViewState;

  const [copied, setCopied] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [popupLngLat, setPopupLngLat] = useState(null);

  // Bounding box drag state
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);

  // Initial data fetch on mount
  useEffect(() => {
    storeResetCamera();
    fetchFireData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentBasemap = BASEMAP_STYLES[activeBasemap] || BASEMAP_STYLES.darkCanvas;

  // Active slot for filtering
  const activeSlot = useMemo(() => {
    if (apiData?.slots && apiData.slots.length > 0 && stepIndex < apiData.slots.length) {
      return apiData.slots[stepIndex];
    }
    return {
      date: targetDate,
      day_night: stepIndex % 2 === 0 ? "D" : "N",
      period_label: stepIndex % 2 === 0 ? "Day" : "Night",
    };
  }, [apiData?.slots, stepIndex, targetDate]);

  // Filter Harmonized GeoJSON (Point geometries for radiant circle markers)
  const filteredHarmonizedGeoJson = useMemo(() => {
    if (!apiData?.harmonizedGeoJson?.features || !showHarmonizedLayer) {
      return { type: "FeatureCollection", features: [] };
    }
    const features = apiData.harmonizedGeoJson.features.filter((f) => {
      const p = f.properties;
      if (p.fire_date_local !== activeSlot.date) return false;

      // Day / Night filter
      if (activeSlot.day_night === "D" && !p.has_day) return false;
      if (activeSlot.day_night === "N" && !p.has_night) return false;

      // Sensor filter
      const sensorOk =
        (p.has_modis && sensorFilters.modis) ||
        (p.has_viirs20 && sensorFilters.viirs20) ||
        (p.has_viirs21 && sensorFilters.viirs21);
      if (!sensorOk) return false;

      // Source type category filter
      const sc = p.source_code;
      if (sc === 0 || sc === -1) {
        if (!categoryFilters.vegetation) return false;
      } else if (sc === 1) {
        if (!categoryFilters.volcano) return false;
      } else if (sc === 2) {
        if (!categoryFilters.staticIndustrial) return false;
      } else if (sc === 3) {
        if (!categoryFilters.offshore) return false;
      }

      return true;
    });

    return { type: "FeatureCollection", features };
  }, [apiData?.harmonizedGeoJson, showHarmonizedLayer, activeSlot.date, activeSlot.day_night, sensorFilters, categoryFilters]);

  // Filter Harmonized Polygons (1.0 km square footprints for high-zoom boundary line)
  const filteredHarmonizedPolygonsGeoJson = useMemo(() => {
    if (!apiData?.harmonizedPolygonsGeoJson?.features || !showHarmonizedLayer) {
      return { type: "FeatureCollection", features: [] };
    }
    const features = apiData.harmonizedPolygonsGeoJson.features.filter((f) => {
      const p = f.properties;
      if (p.fire_date_local !== activeSlot.date) return false;
      if (activeSlot.day_night === "D" && !p.has_day) return false;
      if (activeSlot.day_night === "N" && !p.has_night) return false;
      const sensorOk =
        (p.has_modis && sensorFilters.modis) ||
        (p.has_viirs20 && sensorFilters.viirs20) ||
        (p.has_viirs21 && sensorFilters.viirs21);
      if (!sensorOk) return false;
      return true;
    });
    return { type: "FeatureCollection", features };
  }, [apiData?.harmonizedPolygonsGeoJson, showHarmonizedLayer, activeSlot.date, activeSlot.day_night, sensorFilters]);

  // Filter raw pixel footprints for the active date and pass.
  const filteredRawGeoJson = useMemo(() => {
    if (!apiData?.rawGeoJson?.features || !showRawPixels) {
      return { type: "FeatureCollection", features: [] };
    }
    const features = apiData.rawGeoJson.features.filter((f) => {
      const p = f.properties;
      if (p.local_fire_date !== activeSlot.date) return false;
      if (p.daynight !== activeSlot.day_night) return false;

      if (p.short_sensor === "MODIS" && !sensorFilters.modis) return false;
      if (p.short_sensor === "NOAA-20" && !sensorFilters.viirs20) return false;
      if (p.short_sensor === "NOAA-21" && !sensorFilters.viirs21) return false;

      return true;
    });

    return { type: "FeatureCollection", features };
  }, [apiData?.rawGeoJson, showRawPixels, activeSlot.date, activeSlot.day_night, sensorFilters]);

  // BBox Polygon GeoJSON
  const bboxGeoJson = useMemo(() => {
    const box = dragStart && dragCurrent ? {
      west: Math.min(dragStart.lng, dragCurrent.lng),
      east: Math.max(dragStart.lng, dragCurrent.lng),
      south: Math.min(dragStart.lat, dragCurrent.lat),
      north: Math.max(dragStart.lat, dragCurrent.lat),
    } : selectedBbox;

    if (!box) return null;

    const ring = [
      [box.west, box.south],
      [box.east, box.south],
      [box.east, box.north],
      [box.west, box.north],
      [box.west, box.south],
    ];

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [ring] },
          properties: {},
        },
      ],
    };
  }, [dragStart, dragCurrent, selectedBbox]);

  // Handle map click: drop pin or inspect fire event
  const handleMapClick = useCallback(
    (evt) => {
      if (isDrawingBbox) return;

      const features = evt.features || [];
      const fireFeature = features.find(
        (f) =>
          f.layer.id === "harmonized-circles" ||
          f.layer.id === "harmonized-glow" ||
          f.layer.id === "raw-fill"
      );

      if (fireFeature) {
        setSelectedFeature(fireFeature.properties);
        setPopupLngLat(evt.lngLat);
        return;
      }

      if (evt?.lngLat) {
        setPinnedLocation({
          latitude: evt.lngLat.lat,
          longitude: evt.lngLat.lng,
        });
      }
    },
    [isDrawingBbox, setPinnedLocation]
  );

  // Mouse handlers for dragging bounding box
  const handleMouseDown = (evt) => {
    if (!isDrawingBbox) return;
    setDragStart(evt.lngLat);
    setDragCurrent(evt.lngLat);
  };

  const handleMouseMove = (evt) => {
    if (isDrawingBbox && dragStart) {
      setDragCurrent(evt.lngLat);
    }
  };

  const handleMouseUp = (evt) => {
    if (isDrawingBbox && dragStart) {
      const end = evt?.lngLat || dragCurrent;
      if (!end) return;

      const west = Math.min(dragStart.lng, end.lng);
      const east = Math.max(dragStart.lng, end.lng);
      const south = Math.min(dragStart.lat, end.lat);
      const north = Math.max(dragStart.lat, end.lat);

      if (Math.abs(east - west) > 0.05 && Math.abs(north - south) > 0.05) {
        const newBbox = { west, south, east, north };
        setSelectedBbox(newBbox);
        fetchFireData({ bbox: `${west.toFixed(4)},${south.toFixed(4)},${east.toFixed(4)},${north.toFixed(4)}` });
      }

      setDragStart(null);
      setDragCurrent(null);
      setIsDrawingBbox(false);
    }
  };

  const lat = viewState?.latitude != null ? `${viewState.latitude.toFixed(3)}°` : "0.000°";
  const lon = viewState?.longitude != null ? `${viewState.longitude.toFixed(3)}°` : "0.000°";
  const zoom = viewState?.zoom != null ? `${viewState.zoom.toFixed(2)}x` : "1.00x";

  return (
    <div
      className={`relative h-full w-full bg-[#181818] overflow-hidden ${
        isDrawingBbox ? "cursor-crosshair" : ""
      }`}
    >
      <div className="pointer-events-none absolute left-1/2 top-2 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-md border border-[#3b3b3b] bg-[#171717]/95 px-3 py-1.5 text-[10px] font-mono text-zinc-200 shadow-xl backdrop-blur-sm">
        <span className="font-semibold text-zinc-100">FIRE PIXELS</span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-16 rounded-sm bg-gradient-to-r from-[#fff7bc] via-[#fdae61] to-[#d7301f]" />
          <span className="text-zinc-400">low</span>
          <span className="text-zinc-300">FRP</span>
          <span className="text-red-300">high</span>
        </span>
        <span className="text-zinc-600">|</span>
        <span className="flex items-center gap-1.5">
          <span className="text-zinc-400">Opacity:</span>
          <span className="rounded border border-white/30 bg-orange-400/30 px-1 text-[9px]">Low</span>
          <span className="rounded border border-white/40 bg-orange-400/60 px-1 text-[9px]">Nominal</span>
          <span className="rounded border border-white/50 bg-orange-400/95 px-1 text-[9px]">High</span>
          <span className="text-zinc-500">confidence</span>
        </span>
        <span className="text-zinc-600">|</span>
        <span className="flex items-center gap-1.5">
          <span className="text-[#00f5d4]">● Persistent</span>
          <span className="text-[#f59e0b]">● Day</span>
          <span className="text-[#7aa2f7]">● Night</span>
        </span>
      </div>

      <MapLibreMap
        ref={mapRef}
        key={projectionMode}
        {...viewState}
        onMove={(evt) => onMove && onMove(evt.viewState)}
        onClick={handleMapClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        interactiveLayerIds={["harmonized-circles", "raw-fill"]}
        dragPan={!isDrawingBbox}
        mapStyle={currentBasemap.style}
        projection={{ type: projectionMode }}
        maxPitch={projectionMode === "mercator" ? 60 : 85}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-left" visualizePitch={true} />

        {/* Selected Bounding Box Layer */}
        {bboxGeoJson && (
          <Source id="selected-bbox-source" type="geojson" data={bboxGeoJson}>
            <Layer
              id="selected-bbox-fill"
              type="fill"
              paint={{
                "fill-color": "#ef4444",
                "fill-opacity": 0.15,
              }}
            />
            <Layer
              id="selected-bbox-stroke"
              type="line"
              paint={{
                "line-color": "#ef4444",
                "line-width": 2,
                "line-dasharray": [3, 2],
              }}
            />
          </Source>
        )}

        {/* Raw Sensor Pixel Footprints */}
        {showRawPixels && filteredRawGeoJson.features.length > 0 && (
          <Source id="raw-fires-source" type="geojson" data={filteredRawGeoJson}>
            <Layer
              id="raw-fill"
              type="fill"
              paint={{
                "fill-color": ["get", "color"],
                "fill-opacity": ["coalesce", ["get", "opacity"], 0.72],
              }}
            />
            <Layer
              id="raw-stroke"
              type="line"
              paint={{
                "line-color": ["get", "color"],
                "line-width": 0.35,
                "line-opacity": 0.75,
              }}
            />
          </Source>
        )}

        {/* 1.0 km Footprint Boundary Grid (at zoom >= 10) */}
        {filteredHarmonizedPolygonsGeoJson.features.length > 0 && (
          <Source id="harmonized-polygons-source" type="geojson" data={filteredHarmonizedPolygonsGeoJson}>
            <Layer
              id="harmonized-footprint-line"
              type="line"
              minzoom={10}
              paint={{
                "line-color": ["coalesce", ["get", "strokeColor"], "#f59e0b"],
                "line-width": 1.5,
                "line-opacity": 0.65,
                "line-dasharray": [2, 1],
              }}
            />
          </Source>
        )}

        {/* Harmonized 1.0 km Fire Events Layer (Luminous Screen-Space Circles & Halos) */}
        <Source
          id="harmonized-fires-source"
          type="geojson"
          data={filteredHarmonizedGeoJson}
        >
          {/* Radiant Halo / Fire Glow */}
          <Layer
            id="harmonized-glow"
            type="circle"
            paint={{
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2, 5,
                5, 8,
                8, 14,
                11, 20,
                14, 28,
              ],
              "circle-color": ["coalesce", ["get", "color"], "#f59e0b"],
              "circle-opacity": 0.38,
              "circle-blur": 0.65,
            }}
          />

          {/* Primary Harmonized Fire Event Circle Marker */}
          <Layer
            id="harmonized-circles"
            type="circle"
            paint={{
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2, 3,
                5, 5,
                8, 8.5,
                11, 13,
                14, 19,
              ],
              "circle-color": ["coalesce", ["get", "color"], "#f59e0b"],
              "circle-opacity": ["coalesce", ["get", "opacity"], 0.85],
              "circle-stroke-color": ["coalesce", ["get", "strokeColor"], "#f59e0b"],
              "circle-stroke-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2, 1.2,
                7, 2,
                12, 3,
              ],
              "circle-stroke-opacity": 1.0,
            }}
          />
        </Source>

        {/* Dropped Target Coordinate Pin */}
        {pinnedLocation && (
          <Marker
            longitude={pinnedLocation.longitude}
            latitude={pinnedLocation.latitude}
            anchor="bottom"
            draggable
            onDrag={(evt) =>
              setPinnedLocation({
                latitude: evt.lngLat.lat,
                longitude: evt.lngLat.lng,
              })
            }
          >
            <div
              className="group relative flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
              title="Target Coordinate Pin (Drag to reposition)"
            >
              <div className="absolute -top-6 whitespace-nowrap rounded border border-red-500/50 bg-[#141414]/95 px-1.5 py-0.5 text-[9.5px] font-mono font-medium text-red-300 shadow-lg pointer-events-none">
                {pinnedLocation.latitude.toFixed(3)}°, {pinnedLocation.longitude.toFixed(3)}°
              </div>
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-red-500 fill-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
          </Marker>
        )}

        {/* Fire Event Inspector Popup */}
        {selectedFeature && popupLngLat && (
          <Popup
            longitude={popupLngLat.lng}
            latitude={popupLngLat.lat}
            anchor="bottom"
            onClose={() => setSelectedFeature(null)}
            closeButton={false}
            className="z-50 ufrs-inspector-popup"
          >
            <div className="w-64 rounded-lg border border-[#383838] bg-[#1a1a1a]/98 p-2.5 text-xs text-zinc-100 shadow-2xl font-mono">
              <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-1.5 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Flame className="h-3.5 w-3.5" />
                  <span>{selectedFeature.fire_event_id || selectedFeature.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFeature(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-1.5 text-[10.5px]">
                {/* Fire Behavior Badge */}
                {selectedFeature.fire_behavior_category && (
                  <div className="rounded bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 text-amber-300 font-semibold text-center">
                    {selectedFeature.fire_behavior_category}
                  </div>
                )}

                {/* Calibrated FRP & Peak */}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Calibrated FRP:</span>
                  <span className="font-bold text-orange-400">
                    {selectedFeature.fire_power_mw ?? selectedFeature.frp} MW
                  </span>
                </div>

                {selectedFeature.intensity_category && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Intensity:</span>
                    <span className="text-zinc-200">{selectedFeature.intensity_category}</span>
                  </div>
                )}

                {/* Diurnal Persistence */}
                {selectedFeature.fire_persistence && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Persistence:</span>
                    <span
                      className="px-1 py-0.2 rounded text-[9.5px] font-semibold"
                      style={{ color: selectedFeature.strokeColor || "#f59e0b" }}
                    >
                      {selectedFeature.fire_persistence}
                    </span>
                  </div>
                )}

                {/* Detecting Sensors & Merged Count */}
                {selectedFeature.detecting_sensors && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Sensors:</span>
                    <span className="text-zinc-200">{selectedFeature.detecting_sensors}</span>
                  </div>
                )}

                {selectedFeature.detections_merged != null && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Pixels Merged:</span>
                    <span className="text-zinc-200">{selectedFeature.detections_merged} raw</span>
                  </div>
                )}

                {/* Confidence Level */}
                {(selectedFeature.confidence_level || selectedFeature.std_confidence) && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Confidence:</span>
                    <span className="text-emerald-400">
                      {selectedFeature.confidence_level || selectedFeature.std_confidence}
                    </span>
                  </div>
                )}

                {/* Detection Time Window */}
                {selectedFeature.first_detected_utc && selectedFeature.last_detected_utc && (
                  <div className="border-t border-[#2a2a2a] pt-1 text-[9px] text-zinc-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 text-zinc-500" />
                    <span>
                      {selectedFeature.first_detected_utc.slice(11)} → {selectedFeature.last_detected_utc.slice(11)} UTC
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </MapLibreMap>

      {/* Bottom-Left Controls: Basemap + Globe Camera Overlay */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
        {/* Basemap Trigger Tile */}
        <button
          type="button"
          onClick={() => {
            const nextKey = activeBasemap === "darkCanvas" ? "satellite" : "darkCanvas";
            setActiveBasemap(nextKey);
          }}
          className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border-2 border-white/80 bg-[#1e1e1e] shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer outline-none group"
          title={`Click to switch to ${activeBasemap === "darkCanvas" ? "Satellite" : "Dark Gray"} view`}
          aria-label="Switch Basemap Style"
        >
          <div className="absolute inset-0">{currentBasemap.renderThumbnail()}</div>
          <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-xs py-0.5 text-center text-[9px] font-semibold text-white tracking-tight">
            {currentBasemap.name}
          </div>
        </button>

        {/* Globe Camera Coordinates & Reset Overlay */}
        <div className="h-14 rounded-xl border border-[#383838] bg-[#1a1a1a]/95 backdrop-blur-md p-3 flex flex-col justify-between text-[11px] shadow-2xl min-w-[190px] select-none">
          <div className="flex items-center justify-between gap-3 leading-none">
            <div className="flex items-center gap-3">
              <span>
                <span className="text-zinc-400">Lat:</span>{" "}
                <span className="font-mono text-zinc-100">{lat}</span>
              </span>
              <span>
                <span className="text-zinc-400">Long:</span>{" "}
                <span className="font-mono text-zinc-100">{lon}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`${lat.replace("°", "")},${lon.replace("°", "")}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch (err) {
                  console.error("Failed to copy coordinates:", err);
                }
              }}
              className="text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="Copy coordinates"
              aria-label="Copy coordinates"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 leading-none">
            <span>
              <span className="text-zinc-400">Zoom:</span>{" "}
              <span className="font-mono text-zinc-100">{zoom}</span>
            </span>

            <button
              type="button"
              onClick={storeResetCamera}
              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-amber-400 cursor-pointer transition-colors active:scale-95"
              title="Reset Globe Camera"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
