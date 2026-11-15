# UFRS (Unified Fire Reconnaissance System) — Coding Agent Specification (`AGENTS.md`)

**Project:** UFRS (Unified Fire Reconnaissance System)  
**Frontend Project Path:** `/home/tinted/Projects/UFRS/ufrs-frontend`  
**Challenge:** NASA Space Apps Challenge 2026 — *MODIS and VIIRS Hot Spots*  
**Team:** Sygnition (Lead Developer: Khushal Umesh Naik — [TintedMage on GitHub](https://github.com/TintedMage))  
**Primary IDE & Agent Harnesses:** Visual Studio Code with Antigravity (`AGENTS.md` / `GEMINI.md`) and GitHub Copilot (`AGENTS.md` / `.github/copilot-instructions.md`)

---

## 1. How to Use This File with Your Coding Agent

This specification consolidates all validated algorithms, data schemas, API rules, spatial-temporal harmonization math, and frontend studio architecture from the `NASASpaceApps2026_Sygnition(3).ipynb` research notebook and architectural design sessions into a single source of truth.

Both [VS Code Custom Instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions) and [GitHub Copilot Custom Instructions](https://docs.github.com/en/copilot/reference/custom-instructions-support) natively index `AGENTS.md` when placed in the root of your workspace. To activate this file across all coding agents in `/home/tinted/Projects/UFRS/ufrs-frontend`, run:

```bash
cd /home/tinted/Projects/UFRS/ufrs-frontend
cp AGENTS.md ./AGENTS.md
mkdir -p .github
cp AGENTS.md .github/copilot-instructions.md
cp AGENTS.md ./GEMINI.md
```

### Strict Agent Coding Directives
1. **Plain JavaScript Only (Zero TypeScript):** Write all frontend components and modules strictly in plain JavaScript (`.jsx` and `.js`). Never generate `.tsx`, `.ts`, `tsconfig.json`, or TypeScript type annotations in `ufrs-frontend`.
2. **Zero Placeholders:** Always generate complete, runnable code and shell commands without bracketed placeholders or stubbed functions.
3. **Preserve Verified Math & Constants:** Do not alter the Local Solar Fire Day offset (`UTC + longitude/15.0 - 4.0 hours`), the `1.0 km` [SciPy `cKDTree`](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.cKDTree.html) spatial deduplication logic, or the per-sensor FRP calibration formula unless explicitly instructed.
4. **Exclude Suomi-NPP:** Never query or reference `VIIRS_SNPP_NRT` or `VIIRS_SNPP_SP`. Only use **MODIS (Terra & Aqua)**, **VIIRS NOAA-20**, and **VIIRS NOAA-21**.
5. **Package Management:** Always use `pnpm` for frontend dependency management inside `/home/tinted/Projects/UFRS/ufrs-frontend` and Python virtual environments (`.venv`) for backend services.

---

## 2. Executive Mission & Target Audience

UFRS is an operational satellite wildfire reconnaissance and historical burning analysis web application built for **non-technical government forestry officials, biosphere reserve / protected-area managers, and regional wildfire emergency responders**.

Rather than overwhelming field officers with raw orbital mechanics or uncalibrated thermal channels, UFRS translates multi-satellite detections into three operational answers:
1. **Where is a real wildfire burning right now, and is it surviving overnight?** (Separating multi-pass, day-and-night forest wildfires from short-lived daytime agricultural stubble burning and static industrial heat sources).
2. **What is the true ground footprint and intensity across all active satellites without double-counting?** (Harmonizing `1000 m` MODIS pixels and `375 m` VIIRS NOAA-20/21 pixels into deduplicated `1.0 km` Fire Events with sensor-calibrated Fire Radiative Power).
3. **How does today's fire activity compare against 25+ years of regional fire history?** (Integrating a `2000–Present` Burning Activity Calendar showing seasonal fire windows, bad fire years, and historical severity percentiles).

---

## 3. Frontend Architecture, Dependencies & Setup (`ufrs-frontend`)

**Project Path:** `/home/tinted/Projects/UFRS/ufrs-frontend`  
**Stack:** React + [Vite](https://github.com/fastapi/full-stack-fastapi-template) + [Tailwind CSS v4](https://tailwindcss.com/docs) + Plain JavaScript (`.jsx` / `.js` — zero TypeScript), managed via `pnpm`.

### 3.1 Core Dependencies & Tooling

| Subsystem | Packages & APIs | Implementation Details |
| :--- | :--- | :--- |
| **3D Globe & Mapping** | [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) (`maplibre-gl`) + [react-map-gl](https://visgl.github.io/react-map-gl/) (`Map as MapLibreMap` from `react-map-gl/maplibre`) | Uses native [MapLibre Globe Projection](https://maplibre.org/maplibre-gl-js/docs/examples/display-a-globe-with-a-vector-map/) (`projection={{ type: 'globe' }}`) with Carto Dark Matter vector tiles (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) requiring zero API keys. |
| **Resizable Studio Layout** | [react-resizable-panels v4](https://github.com/bvaughn/react-resizable-panels) (`Group`, `Panel`, `Separator`) | 3-column horizontal workspace using explicit percentage string widths (`"18%"`, `"64%"`, `"18%"`) and custom 3-dot vertical drag handles (`⋮`). |
| **Styling & Theme** | `@tailwindcss/vite` v4 | Dark grey studio palette (`#181818` canvas, `#222222` panels, `#2f2f2f` `1px` borders, `#f59e0b` amber highlights, monospace typography). |
| **Backend API & Data Pipeline** | [FastAPI](https://fastapi.tiangolo.com/tutorial/frontend/) + Python 3.12+ (`pandas`, `numpy`, `geopandas`, `shapely`, [SciPy `cKDTree`](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.cKDTree.html), [Apache Arrow `pyarrow.parquet`](https://arrow.apache.org/docs/python/parquet/parquet.html)) | Connected via Vite's `/api` dev proxy (`http://127.0.0.1:8000`); handles NASA FIRMS chunked ingestion, 1.0 km harmonization, CSV export, and 2000–Present Parquet calendar queries. |
| **Notebook Prototyping Engine** | [Leaflet 1.9.4](https://unpkg.com/leaflet@1.9.4/dist/leaflet.js) (`preferCanvas: true`) + Esri ArcGIS Server Tiles | Used inside `NASASpaceApps2026_Sygnition(3).ipynb` via self-contained `<iframe srcdoc="...">` blocks to bypass Colab localhost widget restrictions. |

### 3.2 Directory & Component Structure

```text
/home/tinted/Projects/UFRS/
├── AGENTS.md                          # Primary coding agent specification
├── GEMINI.md                          # VS Code Antigravity & Gemini CLI mirror
├── UI_GUIDELINES.md                   # Complete Base UI Architecture & Design System
├── README.md                          # Project documentation & quickstart
├── .env                               # Contains FIRMS_MAP_KEY=<32_char_key>
├── backend/
│   ├── main.py                        # FastAPI entrypoint, CORS, StaticFiles mount
│   ├── services/
│   │   ├── harmonizer.py              # Local Solar Fire Day + 1.0 km cKDTree deduplication
│   │   └── history_calendar.py        # 2000-Present PyArrow Parquet query engine
│   └── data/
│       └── historical_hotspots.parquet # Pre-harmonized 2000-Present regional archive
└── ufrs-frontend/
    ├── package.json
    ├── pnpm-lock.yaml
    ├── vite.config.js                 # React + @tailwindcss/vite plugins + /api proxy
    └── src/
        ├── index.css                  # Tailwind v4 import + #181818 dark studio base styles
        ├── App.jsx                    # Resizable workspace + rounded-xl studio panels + DragHandle
        ├── stores/
        │   └── useAppStore.js         # Zustand store (viewState, pinnedLocation, manualCoords, etc.)
        └── components/
            ├── TopLegendBar.jsx       # Header with sidebar toggle, UFRS brand, links & View Dropdown
            ├── HarmonizedGlobe.jsx    # 3D Globe / 2D Map (Esri keyless tiles, basemap tile, red target pin)
            ├── LeftSidebar.jsx        # Horizontal sensors, Drag Selection capsule, Responsive manual coords
            ├── RightPopup.jsx         # Floating telemetry card (Gear trigger, 2D/3D toggle, pass stats)
            └── OverpassTimeline.jsx   # Fixed full-width bottom timeline (20 slots, Day ☀️ & Night 🌙 steps)
```

### 3.3 Full Setup & Development Commands

```bash
# 1. Frontend setup in /home/tinted/Projects/UFRS/ufrs-frontend (Plain JS, pnpm)
cd /home/tinted/Projects/UFRS/ufrs-frontend
pnpm install
pnpm add maplibre-gl react-map-gl react-resizable-panels lucide-react
pnpm add -D tailwindcss @tailwindcss/vite
pnpm run dev

# 2. Backend Python environment setup
cd /home/tinted/Projects/UFRS
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn requests numpy pandas geopandas shapely scipy matplotlib pyarrow python-dotenv folium
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3.4 Reference Configuration & Studio Layout Files (`vite.config.js`, `src/index.css`, `src/App.jsx`)

**`ufrs-frontend/vite.config.js`:**

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
```

**`ufrs-frontend/src/index.css`:**

```css
@import "tailwindcss";
@import "maplibre-gl/dist/maplibre-gl.css";

* {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #181818;
  color: #e5e5e5;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  overflow: hidden;
}
```

**Resizable Studio Layout Pattern in `ufrs-frontend/src/App.jsx` (`react-resizable-panels` v4):**

`react-resizable-panels` v4 exports `Group`, `Panel`, `Separator`, and `usePanelRef`. Percentage widths must be passed as strings with `%` (`"18%"`, `"82%"`), panels feature modern `rounded-xl` corners with `overflow-hidden`, and the separator drag handle has a clean 3-dot grip (⋮) with no full-height center line:

```jsx
import { useEffect } from "react";
import { Panel, Group, Separator, usePanelRef } from "react-resizable-panels";
import TopLegendBar from "./components/TopLegendBar";
import HarmonizedGlobe from "./components/HarmonizedGlobe";
import LeftSidebar from "./components/LeftSidebar";
import RightPopup from "./components/RightPopup";
import OverpassTimeline from "./components/OverpassTimeline";
import { useAppStore } from "./stores/useAppStore";

function DragHandle({ hidden = false }) {
  return (
    <Separator
      className={`group relative flex w-2 shrink-0 items-center justify-center bg-[#181818] hover:bg-[#252526] active:bg-amber-500/20 transition-colors cursor-col-resize outline-none ${
        hidden ? "hidden" : ""
      }`}
    >
      <div className="flex flex-col gap-[3px]">
        <span className="h-[2.5px] w-[2.5px] rounded-full bg-zinc-500 group-hover:bg-amber-400" />
        <span className="h-[2.5px] w-[2.5px] rounded-full bg-zinc-500 group-hover:bg-amber-400" />
        <span className="h-[2.5px] w-[2.5px] rounded-full bg-zinc-500 group-hover:bg-amber-400" />
      </div>
    </Separator>
  );
}

export default function App() {
  const leftPanelRef = usePanelRef();
  const isLeftCollapsed = useAppStore((state) => state.isLeftCollapsed);
  const setLeftCollapsed = useAppStore((state) => state.setLeftCollapsed);

  const toggleLeftSidebar = () => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed() || isLeftCollapsed) {
      panel.expand();
      if (panel.isCollapsed()) panel.resize("18%");
      setLeftCollapsed(false);
    } else {
      panel.collapse();
      setLeftCollapsed(true);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-[#181818] text-[#e5e5e5] overflow-hidden">
      <TopLegendBar onToggleLeftSidebar={toggleLeftSidebar} />
      <div className="flex min-h-0 flex-1 overflow-hidden p-1 pb-0.5">
        <Group orientation="horizontal" className="h-full w-full">
          <Panel
            panelRef={leftPanelRef}
            collapsible
            collapsedSize="0%"
            defaultSize="18%"
            minSize="12%"
            maxSize="32%"
            onResize={(size) => setLeftCollapsed(size.asPercentage <= 0.5)}
          >
            <div className={`h-full overflow-hidden rounded-xl border border-[#2f2f2f] ${isLeftCollapsed ? "hidden" : ""}`}>
              <LeftSidebar />
            </div>
          </Panel>

          <DragHandle hidden={isLeftCollapsed} />

          <Panel defaultSize="82%" minSize="68%">
            <div className="relative h-full w-full overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#181818]">
              <HarmonizedGlobe />
              <RightPopup />
            </div>
          </Panel>
        </Group>
      </div>
      <OverpassTimeline />
    </div>
  );
}
```

**3D Globe & 2D Map Initialization Pattern in `ufrs-frontend/src/components/HarmonizedGlobe.jsx`:**

MapLibre raster styles use keyless Esri Dark Gray and Satellite tiles (zero API keys), support dynamic 3D Globe / 2D Map projection switching, a simple red target pin marker with bidirectional coordinate sync, and a bottom-left camera coordinates overlay:

```jsx
import { useState, useEffect } from "react";
import { Map as MapLibreMap, NavigationControl, Marker } from "react-map-gl/maplibre";
import { Copy, Check, RotateCcw } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAppStore } from "../stores/useAppStore";

export default function HarmonizedGlobe({ viewState: propViewState, onMove: propOnMove }) {
  const storeViewState = useAppStore((state) => state.viewState);
  const storeSetViewState = useAppStore((state) => state.setViewState);
  const storeResetCamera = useAppStore((state) => state.resetCamera);
  const activeBasemap = useAppStore((state) => state.activeBasemap);
  const setActiveBasemap = useAppStore((state) => state.setBasemap);
  const projectionMode = useAppStore((state) => state.projectionMode) || "globe";
  const pinnedLocation = useAppStore((state) => state.pinnedLocation);
  const setPinnedLocation = useAppStore((state) => state.setPinnedLocation);

  const viewState = propViewState || storeViewState;
  const onMove = propOnMove || storeSetViewState;

  useEffect(() => {
    storeResetCamera();
  }, [storeResetCamera]);

  return (
    <div className="relative h-full w-full bg-[#181818] overflow-hidden">
      <MapLibreMap
        key={projectionMode}
        {...viewState}
        onMove={(evt) => onMove && onMove(evt.viewState)}
        onClick={(evt) => {
          if (evt?.lngLat) {
            setPinnedLocation({ latitude: evt.lngLat.lat, longitude: evt.lngLat.lng });
          }
        }}
        projection={{ type: projectionMode }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-left" visualizePitch={true} />

        {/* Dropped Target Coordinate Pin */}
        {pinnedLocation && (
          <Marker
            longitude={pinnedLocation.longitude}
            latitude={pinnedLocation.latitude}
            anchor="bottom"
            draggable
            onDrag={(evt) => setPinnedLocation({ latitude: evt.lngLat.lat, longitude: evt.lngLat.lng })}
          >
            <div className="group relative flex flex-col items-center cursor-grab active:cursor-grabbing select-none">
              <div className="absolute -top-6 whitespace-nowrap rounded border border-red-500/50 bg-[#141414]/95 px-1.5 py-0.5 text-[9.5px] font-mono text-red-300">
                {pinnedLocation.latitude.toFixed(3)}°, {pinnedLocation.longitude.toFixed(3)}°
              </div>
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-red-500 fill-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
          </Marker>
        )}
      </MapLibreMap>
    </div>
  );
}
    </div>
  );
}
```

---

## 4. NASA FIRMS API Ingestion Rules & Constraints

All satellite active fire data is retrieved from the [NASA FIRMS API](https://firms.modaps.eosdis.nasa.gov/api/).

### 4.1 Supported Sensors & Mandatory Suomi-NPP Exclusion

Suomi-NPP (`VIIRS_SNPP_NRT` / `VIIRS_SNPP_SP`) ceased standard feed continuity as of November 2, 2026 and **must be excluded** from all queries. Only query the three active sensor streams below:

| Sensor Display Name | Nominal Pixel Resolution | Near Real-Time (`NRT`) Source ID | Standard Processing (`SP`) Source ID | Raw `satellite` Field Value | Raw `confidence` Format | Thermal Channels |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MODIS (Terra & Aqua)** | `1000 m × 1000 m` | `MODIS_NRT` | `MODIS_SP` | `"Terra"`, `"Aqua"` | Integer `0` to `100` | `brightness`, `bright_t31` |
| **VIIRS NOAA-20** | `375 m × 375 m` | `VIIRS_NOAA20_NRT` | `VIIRS_NOAA20_SP` | `"N20"` | Categorical `"l"`, `"n"`, `"h"` | `bright_ti4`, `bright_ti5` |
| **VIIRS NOAA-21** | `375 m × 375 m` | `VIIRS_NOAA21_NRT` | `VIIRS_NOAA21_SP` | `"N21"` | Categorical `"l"`, `"n"`, `"h"` | `bright_ti4`, `bright_ti5` |

### 4.2 API Key Resolution Order

Use the 3-tier resolution pattern validated in Step 1 of the notebook (`FIRMS_MAP_KEY` is a 32-character alphanumeric string obtained from [NASA FIRMS API Key Registration](https://firms.modaps.eosdis.nasa.gov/content/academy/data_api/firms_api_use.html)):
1. Explicit inline parameter override (if provided in testing).
2. Google Colab Secrets (`google.colab.userdata.get("FIRMS_MAP_KEY")`) when running in notebook environments.
3. Local `.env` / environment variable (`dotenv.load_dotenv()` followed by `os.getenv("FIRMS_MAP_KEY")`).

### 4.3 Area CSV Endpoint & 5-Day Window Chunking

The [NASA FIRMS Area API](https://firms.modaps.eosdis.nasa.gov/api/area/) URL format is:

```text
https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/{source_id}/{bbox}/{day_span}/{start_date}
```

- **Hard `day_span` Limit:** Each request supports **at most 5 days** (`1 <= day_span <= 5`).
- **10-Day Centered Window Strategy (Step 3):** When a user selects a target date `D` (e.g., `2024-07-26`), split the 10-day window (`D-4` through `D+5`) into two 5-day requests per sensor:
  - **Request 1 (`D-4` to `D`):** `start_date = D - 4 days`, `day_span = 5`
  - **Request 2 (`D+1` to `D+5`):** `start_date = D + 1 day`, `day_span = 5`
- **Multi-Week / Multi-Month Chunking (Step 5):** For arbitrary date ranges `[start_dt, end_dt]`, iterate in steps of up to 5 days (`c_end = min(curr + timedelta(days=4), end_dt)`), sleeping `0.15s–0.25s` between HTTP requests.
- **Transaction Quota Accounting:** NASA FIRMS enforces a rolling limit of **5,000 transactions per 10 minutes**, where `1 day × 1 sensor = 1 transaction`.
  - A 10-day fetch across 3 sensors costs `10 × 3 = 30 transactions` (`0.6%` of quota).
  - A 30-day fetch across 3 sensors costs `30 × 3 = 90 transactions` (`1.8%` of quota).

### 4.4 Bounding Box Sanitization (`sanitize_bbox`)

Interactive maps can emit longitudes outside `[-180, 180]` if the user pans across the antimeridian. Always wrap longitudes into `[-180, 180]` and clamp latitudes into `[-90, 90]` in `west,south,east,north` order before calling NASA FIRMS:

```python
def sanitize_bbox(bbox_str: str) -> str:
    """Wraps longitudes into [-180, 180] and clamps latitudes to [-90, 90]."""
    w, s, e, n = map(float, bbox_str.strip().split(","))
    w = ((w + 180.0) % 360.0) - 180.0
    e = ((e + 180.0) % 360.0) - 180.0
    s = max(-90.0, min(90.0, s))
    n = max(-90.0, min(90.0, n))
    return f"{w:.4f},{s:.4f},{e:.4f},{n:.4f}"
```

Equivalent JavaScript helper for the frontend region-drawing tool:

```javascript
export function wrapLon(lon) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}
```

### 4.5 UTC Time Zero-Padding

NASA FIRMS CSV responses return `acq_time` as an integer without leading zeros (e.g., `438` for `04:38 UTC` or `35` for `00:35 UTC`). Immediately normalize `acq_time` upon ingestion:

```python
df["acq_time_utc"] = df["acq_time"].astype(str).str.zfill(4)
```

---

## 5. Rules for Standard Processing (`SP`) vs. Near Real-Time (`NRT`) Data

Understanding when to use `SP` vs. `NRT` is critical because **only `SP` data contains the `type` column** used to classify thermal source types.

### 5.1 Comparison of `SP` and `NRT` Feeds

| Attribute | Near Real-Time (`_NRT`) | Standard Processing (`_SP`) |
| :--- | :--- | :--- |
| **Availability Latency** | Available within 1–3 hours of satellite overpass up to the current day. | Lags behind real time by **2 to 3+ months** (processed in batch after definitive orbital ephemeris calibration). |
| **`type` Column Included?** | **No** (14 columns total; `type` is omitted). | **Yes** (15 columns total; includes integer `type` `0`, `1`, `2`, `3`). |
| **Geolocation & FRP Accuracy** | Operational real-time telemetry; minor edge-of-swath geolocation drift possible. | Science-grade geolocation and calibrated radiative power. |
| **Primary UFRS Use Case** | Active incident reconnaissance, live wildfire tracking, recent 60-day monitoring. | Historical analysis, 2000–Present Burning Activity Calendar, static industrial/volcanic source masking. |

### 5.2 Four Mandatory `SP` vs. `NRT` Routing Rules

1. **Dynamic Availability Lookup (Primary Rule):** Query the [NASA FIRMS Data Availability API](https://firms.modaps.eosdis.nasa.gov/api/data_availability/) (`https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/{map_key}/all`) once per backend startup (cache for 24 hours) to retrieve the exact `min_date` and `max_date` for `MODIS_SP`, `VIIRS_NOAA20_SP`, and `VIIRS_NOAA21_SP`.
2. **Offline Heuristic Fallback (60-Day Rule):** If the availability endpoint is unreachable, route a 5-day chunk to `SP` when `(today_utc - chunk_end_date).days > 60`, and to `NRT` when `(today_utc - chunk_end_date).days <= 60`.
3. **Never Mix `SP` and `NRT` on the Same Date:** For a given sensor and date chunk, query **either** `SP` **or** `NRT`—never both simultaneously, which would duplicate every fire pixel.
4. **Boundary Fallback Retry:** Because `SP` processing lag varies by sensor (sometimes lagging 75–90 days), if a chunk routed to `SP` via the 60-day heuristic returns `0` rows for dates within the last 120 days, automatically retry that specific chunk with the `_NRT` source ID.

---

## 6. Fire Source Categorization (Forest Fires vs. Volcanoes, Stubble Burning & Industrial Sources)

Government forest officials need to distinguish **true forest/wildland fires** from **volcanoes**, **industrial gas flares/factories**, and **agricultural stubble burning**. UFRS implements a **Two-Level Classification Engine** that works across both `SP` and `NRT` datasets.

### 6.1 Level 1 — NASA Science `type` Column (Available in `SP` Data)

When `SP` data is returned, inspect the integer `type` column directly:

| `type` Code | Standardized `source_type` Label | Meaning & Operational Action |
| :--- | :--- | :--- |
| **`0`** | `"Vegetation Fire"` | Presumed wildfire, forest fire, bushfire, or agricultural burn. **Include by default** in wildfire views and historical calendars. |
| **`1`** | `"Active Volcano"` | Thermal anomaly on a mapped volcanic crater/vent. **Filter out** of forestry wildfire alerts; display with a volcano badge if toggled. |
| **`2`** | `"Static Land Source"` | Steel mills, cement kilns, refineries, gas flares, or open-pit mines. **Filter out** of wildfire alerts. |
| **`3`** | `"Offshore Detection"` | Offshore oil/gas platform flaring or marine vessels. **Filter out** of terrestrial forestry views. |
| **`-1`** | `"Unclassified (NRT)"` | Assigned when ingesting `_NRT` data where `type` is absent. Classify using Level 2 spatio-temporal rules below. |

### 6.2 Level 2 — Spatio-Temporal Behavior Classification (Distinguishing Forest Wildfires from Stubble Burning)

Even within `type == 0` (`"Vegetation Fire"`) in `SP` data—and across all `NRT` data where `type` is missing—satellite radiometers cannot tell wood smoke from crop straw smoke in a single snapshot. UFRS separates them using **Diurnal Persistence** and **Multi-Sensor Corroboration**:

| Fire Behavior Category | Physical & Orbital Signature | UFRS Classification Rule |
| :--- | :--- | :--- |
| **Active Forest / Wildland Fire** | Heavy woody fuels burn continuously through the night. Detected during the ~13:30 afternoon pass (`D`) **and** the ~01:30 overnight pass (`N`) on the same Local Solar Fire Day, often across multiple sensors. | `persistence == "Persistent (Day + Night)"` **or** (`persistence == "Night Only"` and `calibrated_frp_mw >= 25.0` outside static industrial masks). |
| **Agricultural Stubble / Crop Residue Burn** | Farmers ignite dry crop residue in the late morning/afternoon (`11:00–16:00` local time). Thin straw fuel burns out in 1–3 hours, disappearing completely before the `01:30 AM` nighttime satellite pass. | `persistence == "Day Only"` **and** single-day duration (does not recur in the same `1.0 km` cell on consecutive nights) **and** `calibrated_frp_mw < 50.0`. |
| **Static Industrial / Volcanic Source (in NRT)** | Factories, flares, and volcanoes emit heat at the exact same coordinates week after week, often appearing as isolated low-FRP night anomalies. | Coordinate matches a known `type in (1, 2, 3)` location from the historical `SP` baseline mask (within `1.0 km`). |

---

## 7. Core Harmonization Engine & Mathematical Algorithms

All formulas below were implemented and verified on the 2024 Park Fire dataset (`SELECTED_BBOX = "-122.1000,39.7000,-121.3000,40.4000"`, `CHOSEN_DATE = "2024-07-26"`, 10-day span `2024-07-22` to `2024-07-31`).

### 7.1 Local Solar Fire Day Bucketing (`local_fire_date`)

**The Problem with UTC Dates:** Sun-synchronous polar-orbiting satellites (MODIS Aqua, NOAA-20, NOAA-21) observe a region around **1:30 PM (`13:30`) local solar time** (Day pass `D`) and again around **1:30 AM (`01:30`) local solar time** that same night (Night pass `N`). Grouping by raw `acq_date` (UTC) splits a single day's fire cycle across midnight UTC, or puts the `01:30 AM` night pass onto the next calendar date.

**The Verified Solution:** Convert UTC acquisition time to local solar time using longitude (`longitude / 15.0` hours per 15° of longitude), then subtract **4.0 hours** so that any overnight pass occurring before `04:00 AM` local solar time stays grouped with the afternoon fire cycle that started the previous afternoon:

```python
utc_dt = pd.to_datetime(
    df["acq_date"].astype(str) + " " + df["acq_time_utc"],
    format="%Y-%m-%d %H%M",
    utc=True,
)
solar_offset = pd.to_timedelta(df["longitude"].astype(float) / 15.0 - 4.0, unit="h")
df["local_fire_date"] = (utc_dt + solar_offset).dt.strftime("%Y-%m-%d")
```

With this transformation, every `local_fire_date` naturally progresses from **Daytime Pass (`D`) → Same-Night Pass (`N`)**.

### 7.2 Cross-Sensor Confidence Normalization

MODIS reports confidence as an integer percentage (`0–100`), whereas VIIRS NOAA-20 and NOAA-21 report categorical strings (`"l"`, `"n"`, `"h"`). Normalize both into a unified 3-tier scale with standardized polygon fill opacities:

| Unified Confidence Level | Rank (`conf_rank`) | VIIRS Raw Input | MODIS Raw Input | Map Polygon Fill Opacity |
| :--- | :--- | :--- | :--- | :--- |
| **`"Low"`** | `1` | `"l"` or `"low"` | `0 <= confidence < 30` | `0.30` |
| **`"Nominal"`** | `2` | `"n"` or `"nominal"` | `30 <= confidence < 80` | `0.62` |
| **`"High"`** | `3` | `"h"` or `"high"` | `80 <= confidence <= 100` | `0.95` |

### 7.3 Exact Scan/Track Pixel Footprint Geometry

Satellite pixels stretch toward the edges of a swath (`scan` and `track` columns give the actual ground pixel dimensions in kilometers). Convert each detection into an exact geographic bounding rectangle `[[south_lat, west_lon], [north_lat, east_lon]]` (or a closed 5-vertex GeoJSON Polygon ring `[[west_lon, south_lat], [east_lon, south_lat], [east_lon, north_lat], [west_lon, north_lat], [west_lon, south_lat]]` for `HarmonizedGlobe.jsx`):

```python
width_m = float(row["scan"]) * 1000.0   # Fallback if missing: 1000.0 for MODIS, 375.0 for VIIRS
height_m = float(row["track"]) * 1000.0

half_dlat = (height_m / 111320.0) / 2.0
half_dlon = (width_m / (111320.0 * max(np.cos(np.radians(lat)), 1e-6))) / 2.0

pixel_bounds = [
    [round(lat - half_dlat, 5), round(lon - half_dlon, 5)],
    [round(lat + half_dlat, 5), round(lon + half_dlon, 5)],
]
```

### 7.4 95th-Percentile FRP Color Scaling (`YlOrRd`)

Raw Fire Radiative Power (`frp` in Megawatts) exhibits extreme right-skew during megafires (in the Park Fire dataset, `frp_min = 0.0 MW`, the 95th percentile is `242.9 MW`, and the maximum single MODIS pixel is `6,002.5 MW`). Always cap the color ramp upper bound at the **95th percentile** so moderate fires remain visually distinct:

```python
frp_min = float(min(all_frp_vals)) if all_frp_vals else 0.0
frp_max = float(np.percentile(all_frp_vals, 95)) if len(all_frp_vals) > 1 else 100.0
if frp_max <= frp_min:
    frp_max = frp_min + 1.0

def frp_to_orange_hex(frp_val: float) -> str:
    norm = np.clip((frp_val - frp_min) / (frp_max - frp_min), 0.0, 1.0)
    return mcolors.to_hex(plt.get_cmap("YlOrRd")(0.25 + 0.70 * norm))
```

### 7.5 1.0 km Spatial Deduplication & Sensor-Calibrated FRP (`harmonize_hotspots`)

Because a single `1000 m × 1000 m` MODIS pixel overlaps up to seven `375 m × 375 m` VIIRS pixels—and each satellite passes twice per day—plotting or summing raw rows inflates hotspot counts by **~11x** and triple-counts radiant energy.

The UFRS harmonization algorithm (`Step 7A`) merges raw detections into **Harmonized 1.0 km Fire Events (`HFE-YYYYMMDD-XXXX`)** per `local_fire_date`:
1. **Group by `local_fire_date`** and sort detections **descending by `frp`** so every 1.0 km cluster anchors on the strongest thermal core first.
2. **Equirectangular Tangent-Plane Projection (in km):**
   - `lat0_rad = np.radians(np.mean(lats))`
   - `x_km = lons * 111.320 * np.cos(lat0_rad)`
   - `y_km = lats * 111.320`
3. **Fast Spatial Indexing via [SciPy `cKDTree`](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.cKDTree.html):**
   - Build `tree = cKDTree( np.column_stack([x_km, y_km]) )`.
   - Greedily iterate through unassigned points in descending FRP order, grouping all unassigned neighbors within `radius_km = 1.0` (`tree.query_ball_point(coords_km[i], r=1.0)`).
4. **FRP-Weighted Centroid:**
   - Compute cluster center `(latitude, longitude)` weighted by `np.maximum(frp, 0.1)`.
5. **Sensor-Calibrated FRP (`calibrated_frp_mw`):**
   - Within the 1.0 km cluster, **sum** `frp` separately for each sensor family (`MODIS`, `NOAA-20`, `NOAA-21`) because multiple `375 m` VIIRS sub-pixels partition the same `1 km` area, then take the **mean across the detecting sensor families**:
     ```python
     per_sensor_frp = member_rows.groupby("short_sensor")["frp"].sum()
     calibrated_frp = float(per_sensor_frp.mean())
     ```

### 7.6 Empirical Benchmark Results (2024 Park Fire Validation Dataset)

| Metric | Verified Value (`2024-07-22` to `2024-07-31`) |
| :--- | :--- |
| **Raw Detections Input** | `17,817` (`2,207` MODIS + `7,467` VIIRS NOAA-20 + `8,143` VIIRS NOAA-21) |
| **Harmonized 1.0 km Fire Events** | `1,595` (`11.17x` spatial compression ratio) |
| **Cross-Sensor Corroboration (`>= 2` Satellites)** | `74.0%` of all harmonized events (`82.2%` of MODIS events corroborated by VIIRS) |
| **Day + Night Persistence Rate** | `24.6%` of active 1.0 km fire cells burned across both Day (`D`) and Night (`N`) passes |
| **Total FRP Calibration Audit** | `413,051.8 MW` sensor-calibrated vs. `1,078,963.8 MW` uncalibrated raw sum (`2.61x` overcount eliminated) |

---

## 8. Standardized Harmonized Data Schema & Reference Python Implementation

### 8.1 Standardized Harmonized CSV & API Schema

Every exported CSV (triggered from `LeftSidebar.jsx`) and `/api/harmonize` JSON payload must adhere to this schema (verified against `harmonized_fire_hotspots_parkfire_2024.csv`, plus the extended `source_type` and `fire_behavior_category` columns for full `SP`/`NRT` support):

| Column Name | Type | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `fire_event_id` | `string` | `"HFE-20240724-0000"` | Unique deterministic ID: `HFE-{YYYYMMDD}-{0000}` ordered by descending FRP on each local fire day. |
| `fire_date_local` | `string` | `"2024-07-24"` | Local Solar Fire Day (`YYYY-MM-DD`) computed via `UTC + lon/15.0 - 4.0h`. |
| `first_detected_utc` | `string` | `"2024-07-25 04:38"` | Earliest raw detection timestamp (`YYYY-MM-DD HH:MM` UTC) merged into this event. |
| `last_detected_utc` | `string` | `"2024-07-25 10:20"` | Latest raw detection timestamp (`YYYY-MM-DD HH:MM` UTC) merged into this event. |
| `latitude` | `float` | `39.90980` | FRP-weighted cluster centroid latitude (5 decimal places). |
| `longitude` | `float` | `-121.82287` | FRP-weighted cluster centroid longitude (5 decimal places). |
| `fire_persistence` | `string` | `"Persistent (Day + Night)"` | Diurnal survival status: `"Persistent (Day + Night)"`, `"Day Only"`, or `"Night Only"`. |
| `fire_power_mw` | `float` | `3312.87` | Sensor-calibrated Fire Radiative Power (`calibrated_frp_mw` in Megawatts). |
| `peak_pixel_power_mw` | `float` | `5544.50` | Maximum single-pixel FRP (`MW`) recorded inside the 1.0 km footprint. |
| `intensity_category` | `string` | `"Extreme (250+ MW)"` | `"Low (<10 MW)"`, `"Moderate (10-50 MW)"`, `"High (50-250 MW)"`, or `"Extreme (250+ MW)"`. |
| `confidence_level` | `string` | `"High"` | Highest normalized confidence among merged detections (`"Low"`, `"Nominal"`, `"High"`). |
| `detections_merged` | `int` | `15` | Count of raw satellite pixel detections merged into this 1.0 km event. |
| `sensor_count` | `int` | `3` | Number of distinct satellite families (`1`, `2`, or `3`) corroborating this event. |
| `detecting_sensors` | `string` | `"MODIS + NOAA-20 + NOAA-21"` | Plus-separated list of corroborating sensors (`MODIS`, `NOAA-20`, `NOAA-21`). |
| `source_type` | `string` | `"Vegetation Fire"` | From `SP` `type` column: `"Vegetation Fire"` (`0`), `"Active Volcano"` (`1`), `"Static Land Source"` (`2`), `"Offshore Detection"` (`3`), or `"Unclassified (NRT)"` (`-1`). |
| `fire_behavior_category` | `string` | `"Likely Forest / Wildland Fire"` | Operational classification: `"Likely Forest / Wildland Fire"`, `"Likely Stubble / Agricultural Burn"`, or `"Static Industrial / Volcanic"`. |
| `data_processing_mode` | `string` | `"SP"` | Indicates whether the underlying FIRMS feed was `"SP"` (Standard Processing) or `"NRT"` (Near Real-Time). |

### 8.2 Complete Reference Python Module (`backend/services/harmonizer.py`)

Coding agents can copy this production-ready module directly into `backend/services/harmonizer.py`:

```python
import io
import os
import time
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from scipy.spatial import cKDTree

SATELLITES = {
    "MODIS (Terra & Aqua)": {"NRT": "MODIS_NRT", "SP": "MODIS_SP"},
    "VIIRS NOAA-20":        {"NRT": "VIIRS_NOAA20_NRT", "SP": "VIIRS_NOAA20_SP"},
    "VIIRS NOAA-21":        {"NRT": "VIIRS_NOAA21_NRT", "SP": "VIIRS_NOAA21_SP"},
}

SOURCE_TYPE_MAP = {
    0: "Vegetation Fire",
    1: "Active Volcano",
    2: "Static Land Source",
    3: "Offshore Detection",
    -1: "Unclassified (NRT)",
}

def sanitize_bbox(bbox_str: str) -> str:
    """Wraps longitudes into [-180, 180] and clamps latitudes to [-90, 90]."""
    w, s, e, n = map(float, bbox_str.strip().split(","))
    w = ((w + 180.0) % 360.0) - 180.0
    e = ((e + 180.0) % 360.0) - 180.0
    s = max(-90.0, min(90.0, s))
    n = max(-90.0, min(90.0, n))
    return f"{w:.4f},{s:.4f},{e:.4f},{n:.4f}"

def standardize_confidence(val) -> tuple[str, int]:
    """Maps MODIS (0-100) and VIIRS (l/n/h) confidence to ('Low'|'Nominal'|'High', rank 1..3)."""
    s = str(val).strip().lower()
    if s in ("l", "low"):
        return "Low", 1
    if s in ("n", "nominal"):
        return "Nominal", 2
    if s in ("h", "high"):
        return "High", 3
    try:
        num = float(s)
        if num < 30:
            return "Low", 1
        elif num < 80:
            return "Nominal", 2
        else:
            return "High", 3
    except ValueError:
        return "Nominal", 2

def classify_intensity(frp_mw: float) -> str:
    if frp_mw < 10.0:
        return "Low (<10 MW)"
    elif frp_mw < 50.0:
        return "Moderate (10-50 MW)"
    elif frp_mw < 250.0:
        return "High (50-250 MW)"
    return "Extreme (250+ MW)"

def classify_fire_behavior(source_code: int, persistence: str, calibrated_frp: float) -> str:
    if source_code in (1, 2, 3):
        return "Static Industrial / Volcanic"
    if persistence == "Persistent (Day + Night)" or calibrated_frp >= 50.0:
        return "Likely Forest / Wildland Fire"
    if persistence == "Night Only" and calibrated_frp >= 25.0:
        return "Likely Forest / Wildland Fire"
    return "Likely Stubble / Agricultural Burn"

def fetch_firms_date_range(map_key: str, raw_bbox: str, start_date_str: str, end_date_str: str) -> dict[str, pd.DataFrame]:
    """Fetches multi-sensor FIRMS data in <=5-day chunks with automatic SP/NRT routing and fallback."""
    bbox = sanitize_bbox(raw_bbox)
    start_dt = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    end_dt = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    today_utc = datetime.now(timezone.utc).date()

    chunks = []
    curr = start_dt
    while curr <= end_dt:
        c_end = min(curr + timedelta(days=4), end_dt)
        span = (c_end - curr).days + 1
        mode = "SP" if (today_utc - c_end).days > 60 else "NRT"
        chunks.append((curr.strftime("%Y-%m-%d"), c_end, span, mode))
        curr = c_end + timedelta(days=1)

    sat_data: dict[str, pd.DataFrame] = {}
    for sat_name, sources in SATELLITES.items():
        parts = []
        for d_str, c_end, span, preferred_mode in chunks:
            source_id = sources[preferred_mode]
            url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/{source_id}/{bbox}/{span}/{d_str}"
            resp = requests.get(url, timeout=30)
            df_part = pd.DataFrame()
            used_mode = preferred_mode

            if resp.status_code == 200 and "latitude" in resp.text[:100]:
                df_part = pd.read_csv(io.StringIO(resp.text))

            # Fallback to NRT if SP returned 0 rows inside the 60-120 day transition zone
            if df_part.empty and preferred_mode == "SP" and (today_utc - c_end).days <= 120:
                nrt_id = sources["NRT"]
                nrt_url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/{nrt_id}/{bbox}/{span}/{d_str}"
                resp_nrt = requests.get(nrt_url, timeout=30)
                if resp_nrt.status_code == 200 and "latitude" in resp_nrt.text[:100]:
                    df_part = pd.read_csv(io.StringIO(resp_nrt.text))
                    used_mode = "NRT"

            if not df_part.empty:
                df_part["data_processing_mode"] = used_mode
                if "type" not in df_part.columns:
                    df_part["type"] = -1
                else:
                    df_part["type"] = df_part["type"].fillna(-1).astype(int)
                parts.append(df_part)

            time.sleep(0.15)

        combined = pd.concat(parts, ignore_index=True) if parts else pd.DataFrame()
        if not combined.empty:
            combined["acq_time_utc"] = combined["acq_time"].astype(str).str.zfill(4)
            combined = combined.sort_values(["acq_date", "acq_time_utc"]).reset_index(drop=True)
        sat_data[sat_name] = combined

    return sat_data

def harmonize_hotspots(sat_data_dict: dict[str, pd.DataFrame], radius_km: float = 1.0) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Merges MODIS, VIIRS NOAA-20, and VIIRS NOAA-21 pixels into 1.0 km Harmonized Fire Events."""
    frames = []
    for sat_label, df in sat_data_dict.items():
        if df is None or df.empty:
            continue
        sub = df.copy()
        sub["sensor_source"] = sat_label
        sub["short_sensor"] = (
            "MODIS" if "MODIS" in sat_label else ("NOAA-20" if "20" in sat_label else "NOAA-21")
        )
        sub["acq_time_utc"] = sub["acq_time"].astype(str).str.zfill(4)
        if "type" not in sub.columns:
            sub["type"] = -1
        if "data_processing_mode" not in sub.columns:
            sub["data_processing_mode"] = np.where(sub["type"] >= 0, "SP", "NRT")

        utc_dt = pd.to_datetime(
            sub["acq_date"].astype(str) + " " + sub["acq_time_utc"],
            format="%Y-%m-%d %H%M",
            utc=True,
        )
        solar_offset = pd.to_timedelta(sub["longitude"].astype(float) / 15.0 - 4.0, unit="h")
        sub["local_fire_date"] = (utc_dt + solar_offset).dt.strftime("%Y-%m-%d")
        sub["utc_dt"] = utc_dt

        conf_parsed = sub["confidence"].apply(standardize_confidence)
        sub["std_confidence"] = [c[0] for c in conf_parsed]
        sub["conf_rank"] = [c[1] for c in conf_parsed]
        sub["daynight_clean"] = sub["daynight"].astype(str).str.strip().str.upper()
        frames.append(sub)

    if not frames:
        return pd.DataFrame(), pd.DataFrame()

    raw_combined = pd.concat(frames, ignore_index=True)
    raw_combined["event_id"] = ""

    events = []
    next_cid = 0

    for fdate, group in raw_combined.groupby("local_fire_date", sort=True):
        g_sorted = group.sort_values("frp", ascending=False)
        idxs = g_sorted.index.to_numpy()
        lats = g_sorted["latitude"].to_numpy(dtype=float)
        lons = g_sorted["longitude"].to_numpy(dtype=float)

        lat0_rad = np.radians(np.mean(lats))
        x_km = lons * 111.320 * np.cos(lat0_rad)
        y_km = lats * 111.320
        coords_km = np.column_stack([x_km, y_km])

        tree = cKDTree(coords_km)
        assigned = np.zeros(len(idxs), dtype=bool)

        for i in range(len(idxs)):
            if assigned[i]:
                continue
            nbrs = tree.query_ball_point(coords_km[i], r=radius_km)
            unassigned_nbrs = [j for j in nbrs if not assigned[j]]

            event_id = f"HFE-{fdate.replace('-', '')}-{next_cid:04d}"
            for j in unassigned_nbrs:
                assigned[j] = True
                raw_combined.loc[idxs[j], "event_id"] = event_id

            member_rows = g_sorted.iloc[unassigned_nbrs]
            weights = np.maximum(member_rows["frp"].to_numpy(dtype=float), 0.1)
            c_lat = float(np.average(member_rows["latitude"], weights=weights))
            c_lon = float(np.average(member_rows["longitude"], weights=weights))

            dn_set = set(member_rows["daynight_clean"])
            if "D" in dn_set and "N" in dn_set:
                persistence = "Persistent (Day + Night)"
            elif "N" in dn_set:
                persistence = "Night Only"
            else:
                persistence = "Day Only"

            per_sensor_frp = member_rows.groupby("short_sensor")["frp"].sum()
            calibrated_frp = round(float(per_sensor_frp.mean()), 2)
            peak_frp = round(float(member_rows["frp"].max()), 2)

            max_rank = int(member_rows["conf_rank"].max())
            max_conf = {1: "Low", 2: "Nominal", 3: "High"}[max_rank]
            short_sensors = sorted(member_rows["short_sensor"].unique())

            # Determine dominant source type code (mode of SP type if available, else -1)
            valid_types = member_rows.loc[member_rows["type"] >= 0, "type"]
            dom_type_code = int(valid_types.mode().iloc[0]) if not valid_types.empty else -1
            source_label = SOURCE_TYPE_MAP.get(dom_type_code, "Unclassified (NRT)")
            behavior_label = classify_fire_behavior(dom_type_code, persistence, calibrated_frp)
            proc_modes = "+".join(sorted(member_rows["data_processing_mode"].unique()))

            events.append({
                "fire_event_id": event_id,
                "fire_date_local": fdate,
                "first_detected_utc": member_rows["utc_dt"].min().strftime("%Y-%m-%d %H:%M"),
                "last_detected_utc": member_rows["utc_dt"].max().strftime("%Y-%m-%d %H:%M"),
                "latitude": round(c_lat, 5),
                "longitude": round(c_lon, 5),
                "fire_persistence": persistence,
                "fire_power_mw": calibrated_frp,
                "peak_pixel_power_mw": peak_frp,
                "intensity_category": classify_intensity(calibrated_frp),
                "confidence_level": max_conf,
                "detections_merged": int(len(member_rows)),
                "sensor_count": int(len(short_sensors)),
                "detecting_sensors": " + ".join(short_sensors),
                "source_type": source_label,
                "fire_behavior_category": behavior_label,
                "data_processing_mode": proc_modes,
            })
            next_cid += 1

    return pd.DataFrame(events), raw_combined
```

---

## 9. Historical Burning Activity Calendar Architecture (2000–Present)

### 9.1 Why a Hybrid Archive + Live Delta Pipeline Is Required

Emergency managers need a calendar of burning activity spanning from the **early 2000s (Nov 2000 MODIS launch) to the present** to see:
1. **Which periods of the year see more fires** (seasonal fire climatology).
2. **Which years had more burning activity** (inter-annual severity anomalies).
3. **How a current fire compares with previous ones** (historical percentile ranking).

Fetching 26 years (`~9,500 days`) live via the NASA FIRMS Area API on every user click is impossible because `9,500 days × 3 sensors = 28,500 transactions`, which immediately exceeds the `5,000 transactions / 10-minute` rate limit and requires ~1,900 sequential HTTP calls.

### 9.2 Two-Tier Storage & Query Design

1. **Tier 1 — Pre-Harmonized Historical Parquet Store (`2000–Present` via [PyArrow Parquet](https://arrow.apache.org/docs/python/parquet/parquet.html)):**
   - Offline batch script ingests historical Standard Processing (`MODIS_SP` for `2000–Present`, `VIIRS_NOAA20_SP` for `2018–Present`, `VIIRS_NOAA21_SP` for `2024–Present`) for the target region/country.
   - Filters `type == 0` (`"Vegetation Fire"`) to strip out volcanoes and industrial flares, runs `harmonize_hotspots()`, and stores a compact daily/spatial Parquet dataset (`backend/data/historical_hotspots.parquet`).
   - Using `pyarrow.parquet.read_table()` with predicate pushdown filters (`latitude`, `longitude`, `fire_date_local`), scanning 26 years of regional harmonized events takes **under 15 milliseconds**.
2. **Tier 2 — Live `NRT` Delta Overlay:**
   - When the user inspects an active fire window, the backend merges the live harmonized `NRT` events for the current year/month on top of the historical Parquet aggregation.

### 9.3 Backend Aggregation Endpoint (`/api/calendar-history`)

```python
import pyarrow.parquet as pq
import pandas as pd
import numpy as np

def build_burning_calendar_payload(parquet_path: str, bbox: tuple[float, float, float, float], current_harm_df: pd.DataFrame) -> dict:
    w, s, e, n = bbox
    table = pq.read_table(
        parquet_path,
        filters=[
            ("latitude", ">=", s),
            ("latitude", "<=", n),
            ("longitude", ">=", w),
            ("longitude", "<=", e),
            ("source_type", "==", "Vegetation Fire"),
        ],
    )
    hist_df = table.to_pandas()

    if not current_harm_df.empty:
        veg_curr = current_harm_df[current_harm_df["source_type"].isin(["Vegetation Fire", "Unclassified (NRT)"])]
        hist_df = pd.concat([hist_df, veg_curr], ignore_index=True).drop_duplicates(subset=["fire_event_id"])

    if hist_df.empty:
        return {"daily_series": [], "yearly_totals": [], "monthly_seasonality": [], "current_percentile": 0.0}

    daily = (
        hist_df.groupby("fire_date_local")
        .agg(
            harmonized_events=("fire_event_id", "count"),
            persistent_events=("fire_persistence", lambda x: int((x == "Persistent (Day + Night)").sum())),
            total_calibrated_frp_mw=("fire_power_mw", "sum"),
        )
        .reset_index()
    )
    daily["year"] = pd.to_datetime(daily["fire_date_local"]).dt.year
    daily["month"] = pd.to_datetime(daily["fire_date_local"]).dt.month
    daily["doy"] = pd.to_datetime(daily["fire_date_local"]).dt.dayofyear

    yearly = (
        daily.groupby("year")
        .agg(
            total_events=("harmonized_events", "sum"),
            persistent_events=("persistent_events", "sum"),
            total_frp_mw=("total_calibrated_frp_mw", lambda s: round(float(s.sum()), 1)),
            peak_daily_events=("harmonized_events", "max"),
        )
        .reset_index()
    )

    monthly = (
        daily.groupby("month")
        .agg(
            avg_events=("harmonized_events", "mean"),
            p90_events=("harmonized_events", lambda s: float(np.percentile(s, 90))),
            avg_frp_mw=("total_calibrated_frp_mw", "mean"),
        )
        .reset_index()
    )

    latest_frp = float(daily.iloc[-1]["total_calibrated_frp_mw"])
    percentile_rank = round(float((daily["total_calibrated_frp_mw"] <= latest_frp).mean() * 100.0), 1)

    return {
        "daily_series": daily.to_dict(orient="records"),
        "yearly_totals": yearly.to_dict(orient="records"),
        "monthly_seasonality": monthly.to_dict(orient="records"),
        "current_percentile": percentile_rank,
    }
```

### 9.4 Three Visual Views for the Frontend Calendar Component (`BurningCalendar.jsx`)

1. **Multi-Decade Heatmap Matrix (`2000–2026`):** A GitHub-contributions-style grid where rows represent years (`2000` through `2026`) and columns represent weeks/days of the year (`Jan`–`Dec`), colored by daily `harmonized_events` or `total_calibrated_frp_mw`. Clicking any cell jumps `HarmonizedGlobe.jsx` and `OverpassTimeline.jsx` to that historical date.
2. **Seasonal Fire Window Chart:** A 12-month bar/area chart plotting historical average and 90th-percentile hotspot counts per month against the selected year's monthly trajectory so officials immediately see peak fire season months.
3. **Current Fire Severity Comparison Card:** Displays a plain-language emergency summary badge in `RightPopup.jsx` (e.g., *"July 26, 2024 recorded 511 harmonized 1 km fire events — ranking in the 99.2nd percentile of all regional fire days since 2000"*).

---

## 10. Studio Theme Tokens, Component Responsibilities & Rendering Guardrails

### 10.1 Dark Grey Studio Theme Palette (`ufrs-frontend`)

| UI Element | Hex Code / Token | Usage in `ufrs-frontend` |
| :--- | :--- | :--- |
| **Studio Canvas Background** | `#181818` | Root viewport, globe canvas container, and `Separator` drag gutter background |
| **Sidebar & Bar Surface** | `#222222` | `TopLegendBar.jsx`, `LeftSidebar.jsx`, `RightPopup.jsx`, and `OverpassTimeline.jsx` surfaces |
| **Structural Borders** | `#2f2f2f` | `1px solid #2f2f2f` panel dividers, card borders, and active resize handle states |
| **Primary Amber Highlight** | `#f59e0b` | Active date/pass badges, slider thumbs, active sensor toggles, and hover accents (`text-amber-500`) |
| **Persistent Fire Accent** | `#00f5d4` | Cyan stroke/badge for `Persistent (Day + Night)` harmonized 1.0 km fire events |
| **Night Pass Accent** | `#7aa2f7` | Blue accent for `Night (🌙)` overpass ticks and night-only detections |
| **FRP Color Ramp (`YlOrRd`)** | `#fed976` → `#fd8d3c` → `#e31a1c` | Hotspot polygon fill color scaled from `frp_min` to 95th-percentile `frp_max` |
| **Typography** | `font-mono` | Monospace telemetry readouts across all sidebars, legends, and timeline ticks |

### 10.2 Component-Level Responsibilities (`src/components/*.jsx`)

| Component File | Core Responsibilities & Props |
| :--- | :--- |
| **`TopLegendBar.jsx`** | Displays the active Local Solar Fire Day & Overpass cycle readout (`☀️ Day` vs `🌙 Night`), the continuous FRP gradient ramp (`frp_min` to 95th-percentile `frp_max` in MW), and the 3-tier Confidence Opacity legend (`Low 30%`, `Nominal 62%`, `High 95%`). |
| **`HarmonizedGlobe.jsx`** | Renders `MapLibreMap` with `projection={{ type: 'globe' }}` and Carto Dark Matter style (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`). Plots GeoJSON layers for MODIS (`1000m`), VIIRS NOAA-20 (`375m`), VIIRS NOAA-21 (`375m`), and Harmonized `1.0 km` Fire Events, emitting live camera `{ latitude, longitude, zoom }` on move. |
| **`LeftSidebar.jsx`** | Houses sensor feed checkboxes/toggles (`MODIS 1000m`, `VIIRS NOAA-20 375m`, `VIIRS NOAA-21 375m`), Harmonized `1.0 km` event overlay toggle, fire source category filters (`Vegetation Fire`, `Volcano`, `Static Industrial`), and the **Export Harmonized CSV** button. |
| **`RightPopup.jsx`** | Displays live pass telemetry for the active timeline slot: total raw vs. harmonized hotspot counts, total calibrated FRP (`MW`), cross-sensor corroboration rate, Day+Night persistence count, and live camera coordinates (`lat`, `lon`, `zoom`). |
| **`OverpassTimeline.jsx`** | Fixed full-width bottom timeline bar stepping chronologically through the 20 sequential Local Solar Fire Day slots (`[Day 1 ☀️, Day 1 🌙, Day 2 ☀️, Day 2 🌙, ...]`) over the 10-day window. |

### 10.3 Keyless Basemap Endpoints

- **3D Globe Vector Style (`ufrs-frontend`):** `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json` (Carto Dark Matter GL style — zero API key required).
- **2D Notebook / Fallback Raster Tiles (`NASASpaceApps2026_Sygnition(3).ipynb`):**
  - Dark Gray Canvas: `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`
  - Street Map (BBOX Selector): `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}`

### 10.4 Browser Rendering Performance Thresholds (Validated in Step 5 Stress Test)

Sort detections ascending by `frp` before building GeoJSON/Canvas layers so the highest-intensity fire cores render on top. Enforce these three point-density guardrails:

| Point Count in Viewport | Verdict Badge | Required Frontend Rendering Behavior |
| :--- | :--- | :--- |
| **`<= 3,000` points** | `✅ Smooth (Raw Pixels)` | Render all exact `scan × track` footprint polygons directly in `HarmonizedGlobe.jsx`. |
| **`3,001 – 15,000` points** | `⚠️ Heavy (Cap Raw / Use WebGL)` | Compute summary telemetry (`RightPopup.jsx`) across **all** rows, and cap rendered raw sensor footprints to the top `3,000–6,000` highest-FRP polygons. |
| **`> 15,000` points** | `🛑 Too Dense (Switch to 1 km Harmonized)` | Automatically toggle `HarmonizedGlobe.jsx` to display the **Harmonized 1.0 km Fire Events** GeoJSON layer, reducing polygon count by `~11x` while preserving 100% of fire perimeters. |
