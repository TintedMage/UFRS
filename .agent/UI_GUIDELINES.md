# UFRS Frontend UI Architecture & Component Guidelines (`UI_GUIDELINES.md`)

**Project:** UFRS (Unified Fire Reconnaissance System)  
**Frontend Workspace:** `/home/tinted/Projects/UFRS/ufrs-frontend`  
**Challenge:** NASA Space Apps Challenge 2026 — *MODIS and VIIRS Hot Spots*  
**Team:** Sygnition  
**Stack:** React 19 + Vite 8 + Tailwind CSS v4 + MapLibre GL 6 + react-map-gl 8 + Zustand 5 + react-resizable-panels 4  
**Directives:** Strict Plain JavaScript (`.jsx` and `.js`), Zero TypeScript, Zero Placeholders, Package Management via `pnpm`.

---

## 1. Visual Studio Design System & Tokens

UFRS implements an operational dark gray command-center aesthetic tailored for forestry officers and wildfire incident commanders:

| Token Category | Value / Class | Description & Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#181818` (`bg-[#181818]`) | Base canvas and 3D globe underlay |
| **Panel Background** | `#222222` (`bg-[#222222]`) / `#1c1c1c` | Sidebar cards, top navigation bar, popup containers |
| **Panel Borders** | `#2f2f2f` (`border-[#2f2f2f]`) / `#383838` | Structural dividing borders between studio panes |
| **Primary Accent** | Amber `#f59e0b` / `#fbbf24` (`text-amber-400`, `bg-amber-500`) | Active telemetry, timeline markers, highlights, primary action buttons |
| **Alert / BBox Accent** | Crimson / Rose `#ef4444` / `#dc2626` (`border-red-500`, `bg-red-950/40`) | Drag & Drop Bounding Box Area Selection controls |
| **Secondary Status** | Emerald `#10b981` (`text-emerald-400`, `bg-emerald-500`) | Harmonized clustering active, 2D map active, copied states |
| **Typography** | Monospace (`font-mono`) | Coordinate digits, telemetry figures, satellite dates, timestamps |

---

## 2. Component Hierarchy & Layout Structure

```text
src/
├── App.jsx                     # Root application container & resizable pane coordinator
├── stores/
│   └── useAppStore.js          # Centralized Zustand store with selective localStorage persistence
└── components/
    ├── TopLegendBar.jsx        # Top header with brand, View Switcher & external links
    ├── LeftSidebar.jsx         # Overhauled control sidebar (Sensors, Coords, Red BBox trigger)
    ├── HarmonizedGlobe.jsx     # Full-viewport MapLibre 3D Globe / 2D Map with basemap + coords overlay
    ├── RightPopup.jsx          # Floating telemetry card (2D/3D projection toggle, pass stats)
    └── OverpassTimeline.jsx    # Fixed bottom chronological Day/Night satellite pass scrubber
```

---

## 3. Detailed Component Specifications

### 3.1 `App.jsx` (Root Workspace Coordinator)
- **Role:** Arranges the screen into a full-height workspace: Top Bar, Resizable 3-Column Middle Section, and Fixed Bottom Timeline.
- **Layout Manager:** Uses `react-resizable-panels` v4 (`Group`, `Panel`, `Separator`, `usePanelRef`). Panels feature modern rounded corners (`rounded-xl` with `overflow-hidden`), and the resize handle features clean 3-dot vertical drag grips (⋮) with subtle hover highlights.
- **Collapsible Sidebar:** Left panel is collapsible (`collapsedSize="0%"`, `defaultSize="18%"`, `minSize="12%"`, `maxSize="32%"`). Expanding and collapsing is synchronized bidirectionally between the panel ref and `useAppStore.isLeftCollapsed`.
- **Center Canvas:** Hosts `HarmonizedGlobe.jsx` with `RightPopup.jsx` positioned absolutely on top as an overlay.

### 3.2 `TopLegendBar.jsx` (Top Navigation & Mode Switcher)
- **Role:** Main application header spanning 100% of the viewport width (`h-10`, `z-10`).
- **Features Implemented:**
  1. **Sidebar Toggle:** Flame icon button (`text-orange-500`) on the left that expands/collapses `LeftSidebar`.
  2. **Brand Title:** `UFRS | Unified Fire Reconnaissance System` with amber branding.
  3. **Right Header Links & View Dropdown:**
     - `Docs` (System documentation anchor)
     - `NASA FIRMS` (External link to FIRMS API documentation)
     - `About` (Team Sygnition & project attribution)
     - **View Switcher Dropdown (`View: Harmonised ⌄`):** Custom dropdown menu placed on the right side switching between `Harmonised` (default) and `Comparison`.

### 3.3 `LeftSidebar.jsx` (Operational Navigation & Sensor Filters)
- **Role:** Overhauled control panel providing direct manual targeting, area selection triggers, and sensor filtering.
- **Features Implemented:**
  1. **Horizontal Sensor Sources (Space-saving):**
     - Three compact horizontal buttons in a 3-column grid:
       - `MODIS` (`1000m` resolution)
       - `NOAA-20` (`375m` resolution)
       - `NOAA-21` (`375m` resolution)
     - Each button shows an active status LED dot and switches individual sensor feeds on/off via `storeToggleSensor`.
     - *Mandatory Exclusion:* Suomi-NPP is strictly omitted per NASA continuity rules.
  2. **Drag Selection Capsule (+ and Trash Buttons):**
     - Pill capsule in soft red/crimson tone (`border-red-500/60 bg-red-500/25`).
     - **`+` Button:** Create / arm new drag-and-drop region selection.
     - **Divider:** Vertical dividing line.
     - **Trash Button (`🗑`):** Clear / delete selection.
  3. **Responsive Manual Coordinates Navigation (Live Pin Sync):**
     - Uses CSS container queries (`@container`) with `grid-cols-1 @[210px]:grid-cols-2`: Longitude dynamically drops below Latitude whenever the sidebar width is constrained (< 210px) and smoothly snaps back side-by-side when space allows.
     - **Live Real-time Pin Sync:** Clicking on the globe or dragging the target pin immediately updates the `Latitude` and `Longitude` fields in real time.
     - Native browser number spin buttons removed to prevent overlapping text.
     - `Latitude (°N)` number input with `min-w-0` and responsive layout.
     - `Longitude (°E)` number input with `min-w-0` and responsive layout.
     - `Zoom Level` input.
     - **Fly & Drop Pin Button:** Navigates map camera smoothly to the entered coordinates and places/moves the red pin marker.
     - **Sync Current Button:** Reads the live camera coordinates from `viewState` and populates the input fields.
     - **Reset Button:** Resets camera, input fields, and pin back to India default view.
     - **Quick Presets:** Instant navigation pills (`India`, `Park Fire`, `Amazon`).

### 3.4 `HarmonizedGlobe.jsx` (3D Globe / 2D Map Canvas)
- **Role:** Core interactive geospatial viewport powered by MapLibre GL JS and `react-map-gl/maplibre`.
- **Features Implemented:**
  1. **Dual Projection Support:** Dynamically switches between 3D Globe (`projection={{ type: "globe" }}`) and 2D Planar Map (`projection={{ type: "mercator" }}`).
  2. **Simple Red Target Pin Marker (`react-map-gl/maplibre` `<Marker>`):**
     - **Simple & Crisp:** Solid red pin icon (`#ef4444`) with no animations.
     - **Drop Anywhere:** Clicking anywhere on the globe or 2D map immediately drops/updates the pin and syncs coordinates with the sidebar inputs.
     - **Draggable:** Pin can be dragged across the map with `cursor-grab / cursor-grabbing` to reposition target coordinates in real time.
     - **Tooltip Badge:** Clean static coordinate readout pill above the pin.
  3. **Keyless Raster Basemaps:**
     - `Dark Gray` (Esri World Dark Gray Canvas Base + Reference)
     - `Satellite` (Esri World Imagery)
  4. **Bottom-Left Control Overlay (Leveled at `h-14`):**
     - **Basemap Switcher Tile:** 56×56px interactive thumbnail. Single-click cycles between Dark Gray and Satellite views.
     - **Globe Camera Telemetry Box:** Displays live formatted Latitude (`°`), Longitude (`°`), Zoom (`x`), a **One-Click Copy** button (copies `lat,lon` to clipboard), and a **Reset** button.
  5. **Automatic Reload Reset:** Always boots to the default India viewpoint (`lat: 25.864, lon: 61.612, zoom: 3.17`) upon page reload (camera coordinates are excluded from localStorage persistence).

### 3.5 `RightPopup.jsx` (Live Overpass Telemetry)
- **Role:** Floating collapsible overlay card on the top-right of the map viewport.
- **Features Implemented:**
  1. **Collapsed State:** Shows a compact floating trigger button with a `Layers` icon labeled `Overpass Summary`.
  2. **Headerless Card:** Clean card with only a top-right close `X` button.
  3. **View Projection Switcher:** Buttons to switch between `3D Globe` and `2D Map` (pitch is set to 0 in 2D mode; zoom level is strictly preserved).
  4. **Overpass Summary:**
     - `Pass Window`: Active date + period (e.g., `2024-07-26 (Day)`).
     - `Merged Hotspots`: Deduplicated detection count.
     - `Total FRP`: Aggregated Fire Radiative Power in Megawatts (MW).
     - `Harmonized Mode`: Indicator for `1.0 km Clustered` vs `Raw Sensor Pixels`.
  5. **Navigation Tips:** Compact reference for pan, zoom, and 3D pitch controls.

### 3.6 `OverpassTimeline.jsx` (Chronological Overpass Scrubber)
- **Role:** Fixed full-width bottom timeline bar (`h-12`) for stepping through the 10-day orbital cycle.
- **Features Implemented:**
  - 20 discrete time slots (10 days × 2 passes: Day ☀️ ~13:30 Local Solar Time, Night 🌙 ~01:30 Local Solar Time).
  - Play/Pause auto-scrubber, Previous/Next step buttons, and interactive slider.
  - Active pass indicator with date and solar period badge.

---

## 4. Zustand Global Store (`useAppStore.js`) Reference

| State Key | Type | Default Value | Persisted? | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `viewState` | `Object` | `{ latitude: 25.864, longitude: 61.612, zoom: 3.17, pitch: 0, bearing: 0 }` | **No** (Resets on reload) | Active MapLibre camera center & zoom |
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

## 5. Backend API Readiness & Integration Contract

The base UI is complete and ready to consume the FastAPI backend (`http://127.0.0.1:8000`) through the Vite `/api` proxy:

### 5.1 Endpoints Required by Frontend
1. **`GET /api/harmonized`**:
   - **Query Params:** `bbox=west,south,east,north&date=YYYY-MM-DD&day_period=Day|Night`
   - **Returns:** GeoJSON FeatureCollection of harmonized `1.0 km` clustered fire events and raw sensor detections.
   - **Properties per Feature:** `fire_event_id`, `fire_power_mw`, `intensity_category`, `fire_persistence`, `detecting_sensors`, `source_type`, `color`, `opacity`, `strokeColor`.
2. **`GET /api/overpass-summary`**:
   - **Query Params:** `bbox=west,south,east,north&date=YYYY-MM-DD&day_period=Day|Night`
   - **Returns:** Telemetry payload (`hotspots`, `totalFrp`, `persistentCount`, `dominantSource`).
3. **`GET /api/calendar-history`**:
   - **Query Params:** `bbox=west,south,east,north`
   - **Returns:** 2000–Present PyArrow Parquet aggregated statistics (`daily_series`, `yearly_totals`, `monthly_seasonality`, `current_percentile`).
4. **`GET /api/export-csv`**:
   - **Query Params:** `bbox=west,south,east,north&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
   - **Returns:** Formatted CSV download of harmonized fire events.

---

## 6. Implementation Roadmap & Deferred Features

| Feature Module | Current Status | Description / Next Steps |
| :--- | :--- | :--- |
| **View Switcher: Comparison Mode** | **Stubbed UI** | Switcher button implemented in `TopLegendBar`. Split-screen or swipe comparison between raw and harmonized feeds to be wired up. |
| **Drag & Drop Area Select** | **Stubbed UI** | Red-themed toggle button and standby card in `LeftSidebar`. Canvas bounding box draw tool and coordinate export to be connected. |
| **FIRMS Backend Ingestion API** | **Backend Ready** | FastAPI endpoints (`/api/harmonized`, `/api/historical`) ready to stream real NASA GeoJSON into MapLibre layers. |
| **Historical Parquet Heatmap** | **Architecture Ready** | 2000–Present regional fire history drawer (`BurningCalendar.jsx`) for seasonal percentile comparisons. |
