import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const DATES = [
  '2024-07-22',
  '2024-07-23',
  '2024-07-24',
  '2024-07-25',
  '2024-07-26',
  '2024-07-27',
  '2024-07-28',
  '2024-07-29',
  '2024-07-30',
  '2024-07-31',
];

export const OVERPASS_SLOTS = DATES.flatMap((date, idx) => [
  {
    slot_index: idx * 2,
    date,
    period: 'Day',
    period_label: 'Day',
    day_night: 'D',
    label: `${date} (Day)`,
    raw_count: 1420 + idx * 110,
    harmonized_count: 1420 + idx * 110,
    total_frp_mw: 98400 + idx * 12300,
    persistent_count: 240,
  },
  {
    slot_index: idx * 2 + 1,
    date,
    period: 'Night',
    period_label: 'Night',
    day_night: 'N',
    label: `${date} (Night)`,
    raw_count: 640 + idx * 45,
    harmonized_count: 640 + idx * 45,
    total_frp_mw: 31200 + idx * 4100,
    persistent_count: 120,
  },
]);

export const DEFAULT_VIEW_STATE = {
  latitude: 15.464,
  longitude: 75.115,
  zoom: 3.17,
  pitch: 0,
  bearing: 0,
};

const safeStorage = createJSONStorage(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
});

export const useAppStore = create(
  persist(
    (set, get) => ({
      // 1. Globe Camera & ViewState
      viewState: DEFAULT_VIEW_STATE,
      setViewState: (newViewState) =>
        set((state) => ({
          viewState: { ...state.viewState, ...newViewState },
        })),
      resetCamera: () => set({ viewState: DEFAULT_VIEW_STATE }),

      // Target Pin Drop Location & Synchronized Manual Coords
      pinnedLocation: { latitude: 39.91, longitude: -121.823 },
      manualCoords: { lat: '39.910', lon: '-121.823', zoom: '8.5' },
      setPinnedLocation: (loc) =>
        set((state) => ({
          pinnedLocation: loc,
          manualCoords: loc
            ? {
                lat: loc.latitude.toFixed(3),
                lon: loc.longitude.toFixed(3),
                zoom: state.manualCoords?.zoom || '3.2',
              }
            : state.manualCoords,
        })),
      clearPinnedLocation: () => set({ pinnedLocation: null }),
      setManualCoords: (coords) =>
        set((state) => ({
          manualCoords: { ...state.manualCoords, ...coords },
        })),

      // 2. Basemap Style & 2D/3D Projection Selection
      activeBasemap: 'darkCanvas',
      setBasemap: (basemapKey) => set({ activeBasemap: basemapKey }),

      activeView: 'harmonized', // 'harmonized' | 'comparison'
      setActiveView: (view) => set({ activeView: view }),

      projectionMode: 'mercator', // 'globe' (3D) or 'mercator' (2D)
      setProjectionMode: (mode) =>
        set((state) => ({
          projectionMode: mode,
          viewState: {
            ...state.viewState,
            pitch: mode === 'mercator' ? 0 : state.viewState.pitch,
          },
        })),
      toggleProjectionMode: () =>
        set((state) => {
          const nextMode = state.projectionMode === 'globe' ? 'mercator' : 'globe';
          return {
            projectionMode: nextMode,
            viewState: {
              ...state.viewState,
              pitch: nextMode === 'mercator' ? 0 : state.viewState.pitch,
            },
          };
        }),

      // 3. Chronological Overpass Timeline
      stepIndex: 8, // Default to target date's Day slot (slot index 8 = D-0 Day)
      setStepIndex: (index) => set({ stepIndex: index }),
      nextStep: () =>
        set((state) => {
          const maxIdx = (state.apiData?.slots?.length || 20) - 1;
          return { stepIndex: Math.min(state.stepIndex + 1, maxIdx) };
        }),
      prevStep: () =>
        set((state) => ({
          stepIndex: Math.max(state.stepIndex - 1, 0),
        })),

      // 4. Sensor Feed Toggles
      sensorFilters: {
        modis: true,
        viirs20: true,
        viirs21: true,
      },
      toggleSensor: (sensorKey) =>
        set((state) => ({
          sensorFilters: {
            ...state.sensorFilters,
            [sensorKey]: !state.sensorFilters[sensorKey],
          },
        })),
      setSensorFilter: (sensorKey, enabled) =>
        set((state) => ({
          sensorFilters: {
            ...state.sensorFilters,
            [sensorKey]: enabled,
          },
        })),

      // 5. Fire Source Category Filters
      categoryFilters: {
        vegetation: true,
        volcano: false,
        staticIndustrial: false,
        offshore: false,
      },
      toggleCategory: (categoryKey) =>
        set((state) => ({
          categoryFilters: {
            ...state.categoryFilters,
            [categoryKey]: !state.categoryFilters[categoryKey],
          },
        })),

      // 6. Harmonized Deduplication & Layer Visibility
      showHarmonizedLayer: true,
      toggleHarmonizedLayer: () =>
        set((state) => ({ showHarmonizedLayer: !state.showHarmonizedLayer })),

      showRawPixels: true,
      toggleRawPixels: () =>
        set((state) => ({ showRawPixels: !state.showRawPixels })),

      // 7. Collapsible Sidebar Panels Layout
      isLeftCollapsed: false,
      isRightCollapsed: false,
      toggleLeftSidebar: () =>
        set((state) => ({ isLeftCollapsed: !state.isLeftCollapsed })),
      toggleRightPopup: () =>
        set((state) => ({ isRightCollapsed: !state.isRightCollapsed })),
      setLeftCollapsed: (collapsed) => set({ isLeftCollapsed: collapsed }),
      setRightCollapsed: (collapsed) => set({ isRightCollapsed: collapsed }),

      // ===================================================================
      // 8. Backend API State & Actions
      // ===================================================================
      targetDate: '2024-07-26',
      setTargetDate: (date) => set({ targetDate: date }),

      radiusKm: 50,
      setRadiusKm: (km) => set({ radiusKm: km }),

      selectedBbox: null,
      setSelectedBbox: (bbox) => set({ selectedBbox: bbox }),
      clearSelectedBbox: () => set({ selectedBbox: null }),

      isDrawingBbox: false,
      setIsDrawingBbox: (v) => set({ isDrawingBbox: v }),

      isLoading: false,
      error: null,
      apiData: {
        meta: null,
        slots: [],
        harmonizedGeoJson: null,
        harmonizedPolygonsGeoJson: null,
        rawGeoJson: null,
      },

      fetchFireData: async (overrideParams) => {
        const state = get();
        set({ isLoading: true, error: null });

        try {
          const params = new URLSearchParams();
          let requestedCenter = null;

          if (overrideParams?.bbox) {
            params.set('bbox', overrideParams.bbox);
            const [west, south, east, north] = overrideParams.bbox.split(',').map(Number);
            if ([west, south, east, north].every(Number.isFinite)) {
              requestedCenter = {
                latitude: (south + north) / 2,
                longitude: (west + east) / 2,
              };
            }
          } else if (overrideParams?.lat != null && overrideParams?.lon != null) {
            params.set('lat', Number(overrideParams.lat).toFixed(5));
            params.set('lon', Number(overrideParams.lon).toFixed(5));
            params.set('radius_km', String(overrideParams?.radiusKm || state.radiusKm));
            requestedCenter = {
              latitude: Number(overrideParams.lat),
              longitude: Number(overrideParams.lon),
            };
          } else if (state.selectedBbox) {
            const b = state.selectedBbox;
            params.set('bbox', `${b.west},${b.south},${b.east},${b.north}`);
            requestedCenter = {
              latitude: (b.south + b.north) / 2,
              longitude: (b.west + b.east) / 2,
            };
          } else if (state.pinnedLocation) {
            params.set('lat', state.pinnedLocation.latitude.toFixed(5));
            params.set('lon', state.pinnedLocation.longitude.toFixed(5));
            params.set('radius_km', String(overrideParams?.radiusKm || state.radiusKm));
            requestedCenter = state.pinnedLocation;
          } else {
            params.set('lat', '39.910');
            params.set('lon', '-121.823');
            params.set('radius_km', '50');
            requestedCenter = { latitude: 39.91, longitude: -121.823 };
          }

          const td = overrideParams?.targetDate || state.targetDate;
          params.set('target_date', td);

          if (overrideParams?.forceRefresh) {
            params.set('force_refresh', 'true');
          }

          const resp = await fetch(`${API_BASE_URL}/api/harmonize?${params.toString()}`);
          if (!resp.ok) {
            throw new Error(`API returned ${resp.status}`);
          }

          const data = await resp.json();

          // Find best slot to snap to (target date Day slot, or highest activity)
          let snapIndex = 8; // default to center
          if (data.slots && data.slots.length > 0) {
            const targetDaySlot = data.slots.findIndex(
              (s) => s.date === td && s.day_night === 'D'
            );
            if (targetDaySlot >= 0) {
              snapIndex = targetDaySlot;
            } else {
              // Snap to highest-activity slot
              let maxCount = -1;
              data.slots.forEach((s, idx) => {
                if (s.harmonized_count > maxCount) {
                  maxCount = s.harmonized_count;
                  snapIndex = idx;
                }
              });
            }
          }

          set({
            apiData: {
              meta: data.meta || null,
              slots: data.slots || [],
              harmonizedGeoJson: data.harmonized_geojson || null,
              harmonizedPolygonsGeoJson: data.harmonized_polygons_geojson || null,
              rawGeoJson: data.raw_geojson || null,
            },
            stepIndex: snapIndex,
            viewState: requestedCenter
              ? {
                  ...state.viewState,
                  ...requestedCenter,
                  zoom: Math.max(state.viewState.zoom, 8),
                  pitch: 0,
                }
              : state.viewState,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          console.error('fetchFireData error:', err);
          set({ isLoading: false, error: err.message });
        }
      },

      exportHarmonizedCsv: async () => {
        const state = get();
        const params = new URLSearchParams();

        if (state.selectedBbox) {
          const b = state.selectedBbox;
          params.set('bbox', `${b.west},${b.south},${b.east},${b.north}`);
        } else if (state.pinnedLocation) {
          params.set('lat', state.pinnedLocation.latitude.toFixed(5));
          params.set('lon', state.pinnedLocation.longitude.toFixed(5));
          params.set('radius_km', String(state.radiusKm));
        }
        params.set('target_date', state.targetDate);

        try {
          const resp = await fetch(`${API_BASE_URL}/api/export-csv?${params.toString()}`);
          if (!resp.ok) throw new Error(`CSV export failed: ${resp.status}`);
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `harmonized_fire_hotspots_${state.targetDate}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('CSV export error:', err);
        }
      },

      // Active Slot Helper
      getActiveSlot: () => {
        const state = get();
        const slots = state.apiData?.slots;
        if (slots && slots.length > 0 && state.stepIndex < slots.length) {
          return slots[state.stepIndex];
        }
        return {
          slot_index: state.stepIndex,
          date: state.targetDate,
          day_night: state.stepIndex % 2 === 0 ? 'D' : 'N',
          period_label: state.stepIndex % 2 === 0 ? 'Day' : 'Night',
          label: `${state.targetDate} (${state.stepIndex % 2 === 0 ? 'Day' : 'Night'})`,
          raw_count: 0,
          harmonized_count: 0,
          total_frp_mw: 0,
          persistent_count: 0,
        };
      },
    }),
    {
      name: 'ufrs-studio-state-v3',
      storage: safeStorage,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.viewState = DEFAULT_VIEW_STATE;
        }
      },
      partialize: (state) => ({
        activeBasemap: state.activeBasemap,
        activeView: state.activeView,
        pinnedLocation: state.pinnedLocation,
        stepIndex: state.stepIndex,
        sensorFilters: state.sensorFilters,
        categoryFilters: state.categoryFilters,
        showHarmonizedLayer: state.showHarmonizedLayer,
        showRawPixels: state.showRawPixels,
        isLeftCollapsed: state.isLeftCollapsed,
        isRightCollapsed: state.isRightCollapsed,
        projectionMode: state.projectionMode,
        targetDate: state.targetDate,
        radiusKm: state.radiusKm,
      }),
    }
  )
);
