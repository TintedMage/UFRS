# UFRS — Unified Fire Reconnaissance System (`ufrs-frontend`)

**Challenge:** NASA Space Apps Challenge 2026 — *MODIS and VIIRS Hot Spots*  
**Team:** Sygnition (Lead Developer: Khushal Umesh Naik — [TintedMage on GitHub](https://github.com/TintedMage))  
**Frontend Stack:** React 19 + Vite 8 + Tailwind CSS v4 + MapLibre GL 6 + react-map-gl 8 + Zustand 5 + react-resizable-panels 4  
**Directives:** Strict Plain JavaScript (`.jsx` / `.js` — zero TypeScript), Zero Placeholders, Package Management via `pnpm`.

---

## 1. Executive Mission

The Unified Fire Reconnaissance System (UFRS) translates raw multi-satellite thermal detections from **MODIS (Terra & Aqua)**, **VIIRS NOAA-20**, and **VIIRS NOAA-21** into three operational wildfire reconnaissance answers for forestry officers, protected-area managers, and emergency responders:

1. **Where is a real wildfire burning right now, and is it surviving overnight?** (Separating day-and-night forest fires from agricultural stubble burning and static industrial flares).
2. **What is the true ground footprint and intensity without double-counting?** (Harmonizing 1000m MODIS and 375m VIIRS detections into deduplicated 1.0 km Fire Events with sensor-calibrated Fire Radiative Power).
3. **How does today's activity compare against 25+ years of fire history?** (Historical burning calendar comparing seasonal percentiles from 2000 to the present).

*Note: Suomi-NPP (`VIIRS_SNPP_NRT`/`VIIRS_SNPP_SP`) is strictly excluded from all queries following NASA continuity guidelines.*

---

## 2. Base UI Architecture & Implemented Components

The base frontend UI is completely developed, verified, and ready for backend API integration:

```text
src/
├── App.jsx                     # Root workspace coordinator (resizable panels, rounded-xl corners)
├── main.jsx                    # React 19 entrypoint
├── index.css                   # Tailwind v4 import + #181818 dark studio base styling
├── stores/
│   └── useAppStore.js          # Centralized Zustand store (viewState, pinnedLocation, manualCoords, etc.)
└── components/
    ├── TopLegendBar.jsx        # Top header with sidebar toggle, UFRS brand, links & View Dropdown
    ├── HarmonizedGlobe.jsx     # 3D Globe / 2D Map (Esri keyless tiles, basemap tile, red target pin)
    ├── LeftSidebar.jsx         # Horizontal sensors, Drag Selection capsule, Responsive manual coords
    ├── RightPopup.jsx          # Floating telemetry card (Gear trigger, 2D/3D toggle, pass stats)
    └── OverpassTimeline.jsx    # Fixed full-width bottom timeline (20 slots, Day ☀️ & Night 🌙 steps)
```

### Component Details
* **`TopLegendBar.jsx`:** Full-width root header (`h-10`) featuring flame sidebar trigger, brand title, right-aligned external links (`Docs`, `NASA FIRMS`, `About`), and a sleek custom dropdown switcher (`View: Harmonised ⌄`).
* **`LeftSidebar.jsx`:** Overhauled control panel with space-saving horizontal sensor buttons (`MODIS 1000m`, `NOAA-20 375m`, `NOAA-21 375m`), red Drag Selection capsule with `+` (create) and `🗑` (delete) buttons, and responsive manual coordinate inputs using container queries (`grid-cols-1 @[210px]:grid-cols-2`) that automatically stack Longitude below Latitude when space is constrained.
* **`HarmonizedGlobe.jsx`:** Geospatial canvas supporting both 3D Globe and 2D Mercator projections with zero-API-key Esri Dark Canvas and Satellite raster tiles. Features an interactive, draggable **Simple Red Target Pin** with real-time bidirectional coordinate sync, a click-to-cycle basemap thumbnail, and a live formatted camera coordinates overlay.
* **`RightPopup.jsx`:** Floating telemetry card triggered by a compact amber gear button `[ ⚙ ]` at the top right of the map canvas, providing projection switching (`3D Globe` vs `2D Map`) and active pass telemetry.
* **`OverpassTimeline.jsx`:** Fixed bottom chronological scrubber stepping through 20 discrete 10-day orbital passes (Day ☀️ ~13:30 Local Solar Time, Night 🌙 ~01:30 Local Solar Time) with auto-play scrubber and navigation controls.
* **`App.jsx`:** Resizable workspace utilizing `react-resizable-panels` v4 with modern `rounded-xl` panel corners and clean 3-dot grip separators (⋮).

---

## 3. Zustand Global State Schema (`src/stores/useAppStore.js`)

| State Key | Type | Default Value | Persisted? | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `viewState` | `Object` | `{ latitude: 25.864, longitude: 61.612, zoom: 3.17, pitch: 0, bearing: 0 }` | **No** (Resets to India on reload) | Active MapLibre camera center & zoom |
| `activeBasemap` | `string` | `'darkCanvas'` (`'darkCanvas'` or `'satellite'`) | **Yes** | Selected basemap tileset |
| `activeView` | `string` | `'harmonized'` (`'harmonized'` or `'comparison'`) | **Yes** | Top bar view mode switcher |
| `pinnedLocation`| `Object` | `{ latitude: 25.864, longitude: 61.612 }` | **Yes** | Target dropped pin marker coordinates |
| `manualCoords`  | `Object` | `{ lat: '25.864', lon: '61.612', zoom: '3.2' }` | **No** | Synchronized manual coordinates text inputs |
| `projectionMode`| `string` | `'globe'` (`'globe'` or `'mercator'`) | **Yes** | 3D Globe vs 2D Map projection |
| `stepIndex` | `number` | `6` (`0` to `19`) | **Yes** | Selected index in `OVERPASS_SLOTS` |
| `sensorFilters` | `Object` | `{ modis: true, viirs20: true, viirs21: true }` | **Yes** | Active sensor feed visibility |
| `categoryFilters`| `Object`| `{ vegetation: true, volcano: false, staticIndustrial: false, offshore: false }` | **Yes** | Level 1 & 2 fire source classifications |
| `showHarmonizedLayer` | `boolean` | `true` | **Yes** | 1.0 km cKDTree deduplication overlay |
| `showRawPixels` | `boolean` | `true` | **Yes** | Raw sensor pixel footprint visibility |
| `isLeftCollapsed` | `boolean` | `false` | **Yes** | Left sidebar expanded/collapsed state |
| `isRightCollapsed` | `boolean`| `false` | **Yes** | Right telemetry popup expanded/collapsed state |

---

## 4. Development & Build Commands

```bash
cd /home/tinted/Projects/UFRS/ufrs-frontend

# Install dependencies (Plain JS, pnpm only)
pnpm install

# Start Vite dev server on http://localhost:5173
pnpm run dev

# Run ESLint validation (0 errors / 0 warnings required)
pnpm run lint

# Production build test
pnpm run build
```

---

## 5. Backend API Readiness & Integration Contract

The frontend connects to the FastAPI backend via Vite's `/api` proxy target (`http://127.0.0.1:8000`):

| Endpoint | Method | Expected Query Parameters | Expected Response Data |
| :--- | :--- | :--- | :--- |
| **`/api/harmonized`** | `GET` | `bbox`, `date`, `day_period` | GeoJSON FeatureCollection of 1.0 km harmonized fire events and raw pixels |
| **`/api/overpass-summary`** | `GET` | `bbox`, `date`, `day_period` | Telemetry payload: `hotspots`, `totalFrp`, `persistentCount`, `dominantSource` |
| **`/api/calendar-history`** | `GET` | `bbox` | 2000–Present PyArrow Parquet statistics: `daily_series`, `yearly_totals`, `monthly_seasonality`, `current_percentile` |
| **`/api/export-csv`** | `GET` | `bbox`, `start_date`, `end_date` | CSV file stream of harmonized fire events |

*For complete UI component design guidelines and specifications, see [`UI_GUIDELINES.md`](./UI_GUIDELINES.md).*  
*For algorithmic, mathematical, and NASA FIRMS API ingestion rules, see [`AGENTS.md`](./AGENTS.md).*
