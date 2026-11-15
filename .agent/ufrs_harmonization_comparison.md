# UFRS Scientific Harmonization Specification: Raw MODIS & VIIRS CSVs → Confirmed Globe Plot Events → Final Downloadable CSV

**Project:** UFRS (Unified Fire Reconnaissance System) — Team Sygnition  
**Challenge:** NASA Space Apps Challenge 2026 (*MODIS and VIIRS Hot Spots*)  
**Primary Data Source:** [NASA FIRMS Area API](https://firms.modaps.eosdis.nasa.gov/api/area/) (`MODIS_SP`/`NRT`, `VIIRS_NOAA20_SP`/`NRT`, `VIIRS_NOAA21_SP`/`NRT`)

---

## 1. The 4-Stage Visual Schema Progression

The four horizontal strip tables below mirror the exact progression from raw multi-sensor satellite CSV feeds to the deduplicated in-memory plot objects rendered on `HarmonizedGlobe.jsx` and the final decision-ready CSV downloaded by forestry officials.

### Stage 1: Raw MODIS CSV Fields (`MODIS_SP` / `MODIS_NRT` — 15 Columns, `1000 m × 1000 m` Nadir Pixel)

| `latitude` | `longitude` | `brightness` | `scan` | `track` | `acq_date` | `acq_time` | `satellite` | `instrument` | `confidence` | `version` | `bright_t31` | `frp` | `daynight` | `type` *(SP only)* |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Center Lat (`deg`) | Center Lon (`deg`) | Ch 21/22 `3.96 µm` Temp (`K`) | E–W Pixel Size (`km`) | N–S Pixel Size (`km`) | UTC Date (`YYYY-MM-DD`) | UTC Time (`int` `HHMM`) | `"Terra"` or `"Aqua"` | `"MODIS"` | Numeric `0`–`100` (`%`) | Collection `"61.03"` | Ch 31 `11.0 µm` Temp (`K`) | Radiant Power (`MW` / `1 km²`) | `"D"` (Day) or `"N"` (Night) | `0` Veg, `1` Volc, `2` Static, `3` Offshore |
| `39.9112` | `-121.8241` | `398.4` | `1.10` | `1.05` | `2024-07-25` | `930` | `"Aqua"` | `"MODIS"` | `100` | `"61.03"` | `312.1` | `1412.6` | `"N"` | `0` |

### `+` Combined With

### Stage 2: Raw VIIRS CSV Fields (`VIIRS_NOAA20_SP`/`NRT` & `VIIRS_NOAA21_SP`/`NRT` — 15 Columns, `375 m × 375 m` Nadir Pixel)

| `latitude` | `longitude` | `bright_ti4` | `scan` | `track` | `acq_date` | `acq_time` | `satellite` | `instrument` | `confidence` | `version` | `bright_ti5` | `frp` | `daynight` | `type` *(SP only)* |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Center Lat (`deg`) | Center Lon (`deg`) | Band I4 `3.74 µm` Temp (`K`) | E–W Pixel Size (`km`) | N–S Pixel Size (`km`) | UTC Date (`YYYY-MM-DD`) | UTC Time (`int` `HHMM`) | `"N20"` or `"N21"` | `"VIIRS"` | String `"l"`, `"n"`, `"h"` | Processing `"2.0"` | Band I5 `11.45 µm` Temp (`K`) | Radiant Power (`MW` / `0.14 km²`) | `"D"` (Day) or `"N"` (Night) | `0` Veg, `1` Volc, `2` Static, `3` Offshore |
| `39.9095` | `-121.8224` | `367.0` | `0.39` | `0.38` | `2024-07-25` | `1020` | `"N20"` | `"VIIRS"` | `"h"` | `"2.0"` | `334.8` | `518.4` | `"N"` | `0` |

### `↓` Harmonized via Local Solar Fire Day Bucketing + `1.0 km` [SciPy `cKDTree`](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.cKDTree.html) Clustering + Sensor-Mean FRP Calibration

### Stage 3: Harmonised Confirmed Event Schema (In-Memory / API Plot Payload for `HarmonizedGlobe.jsx`)

*Minimal, render-ready GeoJSON/JSON structure enabling [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) to plot **one confirmed `1.0 km` fire event** instead of 10–40 overlapping pixel boxes:*

| `id` | `d` | `lat` | `lon` | `radius_m` | `p` | `pc` | `frp` | `raw_n` | `sens` | `conf` | `c` | `st` | `o` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Cluster Event ID | Local Solar Fire Day | FRP-Weighted Lat (`deg`) | FRP-Weighted Lon (`deg`) | Footprint Radius (`m`) | Diurnal Persistence Label | Filter Code (`P`/`D`/`N`) | Calibrated FRP (`MW`) | Merged Pixel Count | Corroborating Sensors | Max Normalized Confidence | 95th-Pct `YlOrRd` Fill Hex | Persistence Ring Stroke Hex | Confidence Fill Opacity |
| `"HFE-20240724-0000"` | `"2024-07-24"` | `39.90980` | `-121.82287` | `1000` | `"Night Only"` | `"N"` | `3312.87` | `15` | `"MODIS + NOAA-20 + NOAA-21"` | `"High"` | `"#bd0026"` | `"#7aa2f7"` | `0.95` |

### `↓` Formatted & Enriched for Operational Forestry & Emergency Management Export

### Stage 4: Final User-Downloadable CSV (`harmonized_fire_hotspots_{date}.csv` — 16 Columns)

*Exported when the user clicks **Export CSV** in `LeftSidebar.jsx` — replaces sensor-specific Kelvin channel names (`brightness`, `bright_ti4`, `bright_t31`, `bright_ti5`) and swath geometry (`scan`, `track`) with decision-ready wildfire intelligence:*

| `fire_event_id` | `fire_date_local` | `first_detected_utc` | `last_detected_utc` | `latitude` | `longitude` | `fire_persistence` | `fire_power_mw` | `peak_pixel_power_mw` | `intensity_category` | `confidence_level` | `detections_merged` | `sensor_count` | `detecting_sensors` | `source_type` | `fire_behavior_category` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `"HFE-20240724-0000"` | `"2024-07-24"` | `"2024-07-25 04:38"` | `"2024-07-25 10:20"` | `39.90980` | `-121.82287` | `"Night Only"` | `3312.87` | `5544.50` | `"Extreme (250+ MW)"` | `"High"` | `15` | `3` | `"MODIS + NOAA-20 + NOAA-21"` | `"Vegetation Fire"` | `"Likely Forest / Wildland Fire"` |

---

## 2. Complete Field-by-Field Mapping & Fate Matrix (Stage 1 & 2 → Stage 3 → Stage 4)

Every column present in the raw MODIS and VIIRS CSV files is accounted for below, detailing its physical meaning, cross-sensor incompatibility, and exact fate in Stage 3 (Globe Plot) and Stage 4 (Final CSV):

| Raw MODIS Column (`15 cols`) | Raw VIIRS Column (`15 cols`) | Physical & Schema Discrepancy | Stage 3 Globe Plot Field (`HarmonizedGlobe.jsx`) | Stage 4 Final CSV Column (`harmonized_fire_hotspots.csv`) | Harmonization Rule & Scientific Fate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *(None — unclustered pixel)* | *(None — unclustered pixel)* | Raw feeds list individual detector triggers without grouping co-located detections of the same fire. | `id` (`"HFE-20240724-0000"`) | `fire_event_id` | **Synthesized Primary Key:** Assigned after sorting each `local_fire_date` descending by `frp` and clustering within `r = 1.0 km`. |
| `acq_date` (`YYYY-MM-DD`) + `acq_time` (`int` `HHMM`) | `acq_date` (`YYYY-MM-DD`) + `acq_time` (`int` `HHMM`) | `acq_time` lacks leading zeros (`438` = `04:38 UTC`). Grouping by UTC date splits `13:30` local afternoon and `01:30` local overnight passes across midnight UTC. | `d` (`"2024-07-24"`) | `fire_date_local`, `first_detected_utc`, `last_detected_utc` | **Temporal Normalization:** Zero-pads `acq_time` (`zfill(4)`), computes `local_fire_date` via `UTC + lon/15.0 - 4.0h`, and extracts cluster `min`/`max` UTC timestamps. |
| `latitude`, `longitude` (`1000 m` pixel center) | `latitude`, `longitude` (`375 m` pixel center) | MODIS center has $\pm 500\text{ m}$ nadir uncertainty; VIIRS has $\pm 187.5\text{ m}$ nadir uncertainty. | `lat`, `lon` | `latitude`, `longitude` | **Radiometric Centroid:** Computes FRP-weighted average position (`weights = np.maximum(frp, 0.1)`) across all merged pixels in the `1.0 km` cluster. |
| `daynight` (`"D"` or `"N"`) | `daynight` (`"D"` or `"N"`) | Identical schema (`"D"` daytime ascending/descending, `"N"` nighttime), but individual rows only show a single pass. | `p`, `pc` (`"P"`, `"D"`, `"N"`), `st` (ring color) | `fire_persistence` | **Diurnal Survival Synthesis:** Evaluates unique `daynight` values inside the `1.0 km` cluster over the 24h Solar Fire Day: `{"D","N"}` $\to$ `"Persistent (Day + Night)"`, `{"D"}` $\to$ `"Day Only"`, `{"N"}` $\to$ `"Night Only"`. |
| `frp` (`MW` per `1.0 km²` pixel) | `frp` (`MW` per `0.14 km²` pixel) | A `1.0 km²` fire is covered by 1 MODIS pixel + up to 7 NOAA-20 pixels + up to 7 NOAA-21 pixels. Naive summation across sensors triple-counts radiant energy. | `frp` (calibrated MW), `c` (`YlOrRd` hex fill) | `fire_power_mw`, `peak_pixel_power_mw`, `intensity_category` | **Two-Stage Sensor Calibration:** Sums `frp` *within* each sensor family (`MODIS`, `NOAA-20`, `NOAA-21`) to integrate sub-pixel area, then takes the **mean across detecting sensors**. Also retains `max(frp)` as `peak_pixel_power_mw`. |
| `confidence` (`int` `0` to `100`) | `confidence` (`str` `"l"`, `"n"`, `"h"`) | Incompatible data types (`int64` vs `str`) and incompatible statistical algorithms. | `conf` (`"High"`), `o` (fill opacity `0.30`/`0.62`/`0.95`) | `confidence_level` | **3-Tier Lattice Promotion:** Normalizes MODIS (`<30` Low, `30–79` Nominal, `80+` High) and VIIRS (`l` Low, `n` Nominal, `h` High) to ranks `1, 2, 3`, taking `max(rank)` across merged detections. |
| `satellite` (`"Terra"`, `"Aqua"`), `instrument` (`"MODIS"`) | `satellite` (`"N20"`, `"N21"`), `instrument` (`"VIIRS"`) | Different naming conventions across NASA Earth Observing System (EOS) and Joint Polar Satellite System (JPSS). | `raw_n` (`15`), `sens` (`"MODIS + NOAA-20 + NOAA-21"`) | `detections_merged`, `sensor_count`, `detecting_sensors` | **Multi-Sensor Corroboration Audit:** Records total merged pixels (`detections_merged`), count of distinct sensor families (`1–3`), and standardized sensor string (`MODIS`, `NOAA-20`, `NOAA-21`). |
| `type` (`0, 1, 2, 3` in `SP`; absent in `NRT`) | `type` (`0, 1, 2, 3` in `SP`; absent in `NRT`) | Present only in Standard Processing (`SP`, $>60$ days old); missing in Near Real-Time (`NRT`). Furthermore, `type = 0` mixes forest wildfires with crop stubble burning. | *(Filtered via sidebar checkboxes)* | `source_type`, `fire_behavior_category` | **Two-Level Source Classifier:** Maps `SP` `type` (`0` Vegetation, `1` Volcano, `2` Static Land, `3` Offshore; `-1` Unclassified in `NRT`) and combines with `fire_persistence` + `fire_power_mw` to classify operational fire behavior. |
| `scan` (`km`), `track` (`km`) | `scan` (`km`), `track` (`km`) | MODIS pixels stretch to `4.8 km × 2.0 km` at swath edge; VIIRS stays near `0.38 km – 0.80 km` via onboard aggregation. | `radius_m: 1000` *(or exact `b` rectangle in Raw Pixel view)* | *(Dropped from Final CSV)* | **Geometric Standardization:** Used to draw exact pixel rectangles in Raw Sensor View; replaced in Harmonized View and Final CSV by the standardized `1.0 km` event centroid (`latitude`, `longitude`). |
| `brightness` (Ch 21/22 `~3.96 µm` in `K`) | `bright_ti4` (Band I4 `3.74 µm` in `K`) | Column name mismatch (`brightness` vs `bright_ti4`) and different detector saturation limits (`~500 K` vs `367 K`). | *(Omitted — represented by `frp` color ramp `c`)* | *(Dropped from Final CSV)* | **Replaced by Calibrated FRP:** Brightness temperatures depend on pixel fill fraction and saturate at `367 K` on VIIRS I4; `fire_power_mw` (`FRP`) provides a physically integrated energy rate in Megawatts. |
| `bright_t31` (Ch 31 `~11.0 µm` in `K`) | `bright_ti5` (Band I5 `11.45 µm` in `K`) | Column name mismatch (`bright_t31` vs `bright_ti5`) and different spectral response functions. | *(Omitted)* | *(Dropped from Final CSV)* | **Internal Contextual Background:** Used by NASA's onboard contextual fire detection algorithm to reject warm ground/clouds; omitted from end-user forestry exports. |
| `version` (`"61.03"` / `"6.1NRT"`) | `version` (`"2.0"` / `"2.0NRT"`) | Internal NASA algorithm collection string. | *(Omitted)* | *(Dropped from Final CSV)* | **Metadata Stripped:** Stripped from user-facing CSV to keep the downloadable table focused on actionable fire metrics. |

---

## 3. Deep Scientific & Mathematical Foundations

### 3.1 Orbital Mechanics & The Local Solar Fire Day Equation (`fire_date_local`)

All three active satellite feeds operate in sun-synchronous, near-polar orbits, meaning they cross any given latitude at nearly constant **Local Solar Time (LST)** every day:
- **MODIS Terra:** Descending daytime node at `~10:30 LST`, ascending nighttime node at `~22:30 LST`.
- **MODIS Aqua:** Ascending daytime node at `~13:30 LST`, descending nighttime node at `~01:30 LST`.
- **VIIRS NOAA-20 (JPSS-1):** Ascending daytime node at `~13:30 LST`, descending nighttime node at `~01:30 LST`.
- **VIIRS NOAA-21 (JPSS-2):** Ascending daytime node at `~13:30 LST`, descending nighttime node at `~01:30 LST` (orbiting `~50 minutes` / half an orbit behind NOAA-20).
- *(Note: **Suomi-NPP** is explicitly excluded due to NASA FIRMS data cessation/degradation as of November 2, 2026).*

**Why Raw UTC Dates Fail Operational Forestry:**
1. **The UTC Time-Zone Split:** In California (`longitude` $\approx -121.8^\circ$, `UTC-8`), the `13:30 LST` peak afternoon burn pass occurs at `21:30 UTC` on Day $D$, while the `01:30 LST` overnight pass occurs at `09:30 UTC` on Day $D+1$. Even worse, in regions where afternoon crosses `00:00 UTC`, daytime and nighttime passes split unpredictably.
2. **The Post-Midnight Solar Split:** Even in pure Local Solar Time ($t_{\text{LST}} = t_{\text{UTC}} + \lambda / 15^\circ$), the `01:30 AM` nighttime overpass occurs 1.5 hours *after* local midnight (`00:00 LST`), placing it on the next calendar date (`D+1`) instead of pairing it with the afternoon fire cycle (`13:30 LST` on Day `D`) that ignited it.

**The UFRS Local Solar Fire Day Formula:**
By shifting Local Solar Time backward by **4.0 hours** (setting the operational fire-day rollover at `04:00 AM` Local Solar Time, during the diurnal minimum of wildfire activity and after the `~01:30 AM` satellite overpass constellation has completed), every afternoon pass (`~10:30` and `~13:30 LST`) and its corresponding overnight pass (`~22:30` and `~01:30 LST`) are grouped into a single chronological **Local Solar Fire Day** ($d_{\text{local}}$):

$$\Delta t_{\text{solar}}(\lambda) = \left(\frac{\lambda}{15.0^\circ\text{ hr}^{-1}} - 4.0\right)\text{ hours}$$

$$d_{\text{local}} = \text{strftime}\!\left(t_{\text{UTC}} + \Delta t_{\text{solar}}(\lambda),\; \text{"\%Y-\%m-\%d"}\right)$$

---

### 3.2 Swath Geometry, Pixel Area Discrepancy (`7.11×`), & `cKDTree` Spatial Deduplication

#### Nadir Area Ratio
At sub-satellite nadir ($\theta_{\text{scan}} = 0^\circ$):
- **MODIS Nadir Area:** $A_{\text{MODIS}} = 1.000\text{ km} \times 1.000\text{ km} = 1.000\text{ km}^2$
- **VIIRS I-Band Nadir Area:** $A_{\text{VIIRS}} = 0.375\text{ km} \times 0.375\text{ km} = 0.140625\text{ km}^2$
- **Area Ratio:** $\frac{A_{\text{MODIS}}}{A_{\text{VIIRS}}} = \frac{1.000}{0.140625} = \mathbf{7.111\times}$

Consequently, a homogeneous `1.0 km²` flaming zone triggers **1 MODIS pixel**, up to **7 VIIRS NOAA-20 pixels**, and up to **7 VIIRS NOAA-21 pixels** per overpass. Across day and night passes, a single stationary `1.0 km` fire cell generates **15 to 45 raw CSV rows per day**.

#### Off-Nadir Scan Growth (`scan` and `track`)
- **MODIS Whiskbroom Growth:** Without onboard detector aggregation, MODIS pixel dimensions grow rapidly with scan angle $\theta \in [-55^\circ, +55^\circ]$ across its `2,330 km` swath, reaching $\text{scan} \approx 4.8\text{ km}$ (east–west) by $\text{track} \approx 2.0\text{ km}$ (north–south) at swath edge (`~9.6 km²`).
- **VIIRS 3-Zone Aggregation:** VIIRS (`3,040 km` swath) aggregates 3 native detectors along-scan from $0^\circ$–$31.72^\circ$, 2 detectors from $31.72^\circ$–$44.86^\circ$, and 1 detector from $44.86^\circ$–$56.28^\circ$, constraining maximum edge pixel size to $\approx 0.8\text{ km} \times 0.8\text{ km}$.

When rendering **Raw Sensor Pixels** (for visual inspection), exact bounding-box offsets $(\Delta\phi, \Delta\lambda)$ are derived from `scan` and `track` (in km) using the WGS-84 meridional/parallel scale factor ($1^\circ \text{ lat} \approx 111.320\text{ km}$):

$$\Delta\phi_{\text{half}} = \frac{\text{track}_{\text{km}}}{2 \times 111.320}, \qquad \Delta\lambda_{\text{half}} = \frac{\text{scan}_{\text{km}}}{2 \times 111.320 \times \max(\cos(\phi\cdot\pi/180),\, 10^{-6})}$$

#### Greedy Peak-Core `1.0 km` `cKDTree` Deduplication
To collapse multi-sensor detections into **Stage 3 Confirmed Fire Events** (`HFE`), UFRS executes the following 4-step spatial algorithm within each `local_fire_date`:
1. **Peak-Thermal Ordering:** Sort all $N$ daily detections descending by $\text{FRP}$ ($\text{FRP}_1 \ge \text{FRP}_2 \ge \dots \ge \text{FRP}_N$) so cluster centers lock onto intense flame fronts rather than peripheral smoke or edge-of-swath artifacts.
2. **Equirectangular Tangent-Plane Projection:** Project $(\phi_k, \lambda_k)$ into local Cartesian coordinates $(x_k, y_k)$ in kilometers around the daily mean latitude $\bar{\phi}$:
   $$x_k = 111.320\,\lambda_k \cos(\bar{\phi}), \qquad y_k = 111.320\,\phi_k$$
3. **Euclidean Ball Query ($r = 1.0\text{ km}$):** Index $\{(x_k, y_k)\}$ in a 2D [SciPy `cKDTree`](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.cKDTree.html) and iteratively group all unassigned neighbors within $r = 1.0\text{ km}$ of the highest-FRP unassigned seed pixel $i$:
   $$\mathcal{C}_m = \left\{\, j \;\middle|\; \neg\text{assigned}(j) \;\land\; \sqrt{(x_j - x_i)^2 + (y_j - y_i)^2} \le 1.0\text{ km} \,\right\}$$
4. **FRP-Weighted Centroid:** Compute the cluster's true thermal center $(\hat{\phi}_m, \hat{\lambda}_m)$ weighted by $w_k = \max(\text{FRP}_k, 0.1)$:
   $$\hat{\phi}_m = \frac{\sum_{k \in \mathcal{C}_m} w_k\,\phi_k}{\sum_{k \in \mathcal{C}_m} w_k}, \qquad \hat{\lambda}_m = \frac{\sum_{k \in \mathcal{C}_m} w_k\,\lambda_k}{\sum_{k \in \mathcal{C}_m} w_k}$$

---

### 3.3 Radiometric Physics & Two-Stage Sensor-Calibrated FRP (`fire_power_mw`)

#### Why Brightness Temperatures (`brightness` vs `bright_ti4`) Cannot Be Combined
- **Spectral Band & Saturation Mismatch:** MODIS measures $T_4$ at `3.959 µm` (`brightness`, saturating near `~500 K`), whereas VIIRS `375 m` Active Fire measures $T_{\text{I4}}$ at `3.74 µm` (`bright_ti4`, which **saturates at `367 K`** on moderate-to-intense fires).
- Because a `367 K` (`93.85 °C`) ceiling is reached by almost every active crown fire on VIIRS Band I4, averaging or comparing `brightness` and `bright_ti4` understates VIIRS fire intensity.
- Instead, NASA FIRMS computes **Fire Radiative Power (`frp` in Megawatts)** using Wooster et al.'s (2003) $4\,\mu\text{m}$ spectral radiance method ($L_4 - L_{4,\text{bg}}$), switching automatically to the unsaturated `750 m` M13 dual-gain channel (`4.05 µm`, saturation `~634 K`) whenever VIIRS I4 saturates at `367 K`, and apportioning that radiant power across the constituent `375 m` I-band fire pixels.

#### Why Two-Stage FRP Calibration Is Required
Fire Radiative Power ($\text{FRP}$, in $\text{MW} = \text{MJ s}^{-1}$) is an **extensive** physical quantity integrated over the area of the pixel:
- **Within a single sensor (`Intra-Sensor`):** If a `1.0 km²` fire is broken into six contiguous `375 m` VIIRS NOAA-20 pixels each radiating $100\text{ MW}$, the total radiant power observed by NOAA-20 inside that `1.0 km` cell is their **sum**: $\sum \text{FRP}_{\text{NOAA-20}} = 600\text{ MW}$.
- **Across independent sensors (`Inter-Sensor`):** If MODIS simultaneously observes that same `1.0 km²` cell at $620\text{ MW}$ and VIIRS NOAA-21 observes it at $580\text{ MW}$, summing all three sensors ($620 + 600 + 580 = 1800\text{ MW}$) **triple-counts the same fire's radiant flux**.

Therefore, UFRS computes **Sensor-Calibrated FRP (`fire_power_mw`)** via a Two-Stage Intra-Sensor Sum / Inter-Sensor Mean estimator over the set of detecting sensor families $S_m \subseteq \{\text{"MODIS"}, \text{"NOAA-20"}, \text{"NOAA-21"}\}$:

$$\text{FRP}_{\text{calibrated}}(m) = \frac{1}{|S_m|} \sum_{s \in S_m} \left( \sum_{k \in \mathcal{C}_m,\; \text{sensor}(k) = s} \text{FRP}_k \right)$$

---

### 3.4 Confidence Lattice Normalization & Source Categorization Rules

#### 1. Cross-Sensor Confidence Normalization (`confidence_level`)

| Standardized Tier | Rank ($R_k$) | VIIRS Categorical Input (`confidence`) | MODIS Numeric Input (`confidence`) | Globe Fill Opacity (`o`) | Physical Interpretation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`"Low"`** | `1` | `"l"` or `"low"` | $0 \le c < 30$ | `0.30` | Potential daytime sun-glint, warm bare soil, or marginal $\Delta T_{4-5}$ anomaly. |
| **`"Nominal"`** | `2` | `"n"` or `"nominal"` | $30 \le c < 80$ | `0.62` | High-probability thermal anomaly passing all contextual background tests. |
| **`"High"`** | `3` | `"h"` or `"high"` | $80 \le c \le 100$ | `0.95` | Intense combustion core (often saturating VIIRS I4 at `367 K` or $T_4 > 360\text{ K}$ on MODIS). |

For any merged cluster $\mathcal{C}_m$, the event confidence rank is $R_{\text{event}} = \max_{k \in \mathcal{C}_m} R_k$.

#### 2. Dynamic `SP` vs. `NRT` Routing & Fire Behavior Classification (`source_type` & `fire_behavior_category`)
- **`SP` (Standard Processing) vs. `NRT` (Near Real-Time) Switching:**
  - When a 5-day query chunk ends $> 60\text{ days}$ before today UTC (or prior to the `max_date` from the [NASA FIRMS Data Availability API](https://firms.modaps.eosdis.nasa.gov/api/data_availability/)), UFRS queries `MODIS_SP`, `VIIRS_NOAA20_SP`, and `VIIRS_NOAA21_SP`, which include the integer **`type`** column (`0` = Presumed Vegetation Fire, `1` = Active Volcano, `2` = Other Static Land Source, `3` = Offshore).
  - For recent dates ($\le 60\text{ days}$, or as an automatic fallback if `SP` returns `0` rows inside the `60–120 day` transition window), UFRS queries `_NRT` feeds where `type` is absent (assigned `type = -1` $\to$ `"Unclassified (NRT)"`).
- **Separating Forest Wildfires from Agricultural Stubble Burning (`fire_behavior_category`):**
  1. **`"Static Industrial / Volcanic"`:** `type` code is `1` (Volcano), `2` (Static Industrial/Refinery/Flare), or `3` (Offshore).
  2. **`"Likely Forest / Wildland Fire"`:** `type` is `0` or `-1` **AND** (`fire_persistence == "Persistent (Day + Night)"` **OR** `fire_power_mw >= 50.0 MW` **OR** (`fire_persistence == "Night Only"` and `fire_power_mw >= 25.0 MW`)). Heavy forest fuels retain thermal inertia and continue burning through the `~01:30 AM` nighttime overpass.
  3. **`"Likely Stubble / Agricultural Burn"`:** `type` is `0` or `-1` **AND** `fire_persistence == "Day Only"` **AND** `fire_power_mw < 50.0 MW`. Thin crop residue is ignited by farmers during the day and self-extinguishes within 1–3 hours prior to the `~01:30 AM` night pass.

---

## 4. Empirical Trace & Validation on the 2024 Park Fire Dataset

### 4.1 Single-Event Trace: `15 Raw Detections` → `1 Plot Object` → `1 CSV Row` (`HFE-20240724-0000`)

During the 2024 Park Fire in California (`SELECTED_BBOX = "-122.1000,39.7000,-121.3000,40.4000"`), on Local Solar Fire Day **`2024-07-24`**, 15 raw pixels were detected within $1.0\text{ km}$ of `(39.90980, -121.82287)` between `04:38 UTC` and `10:20 UTC`:

1. **Stage 1 + Stage 2 Raw Input Summary (`15 rows`):**
   - **MODIS (`MODIS_SP`):** `2` rows (`satellite="Aqua"`, `acq_time=0930`, `confidence=100`, `scan=1.1`, `track=1.0`, `type=0`), $\sum \text{FRP}_{\text{MODIS}} = 2,845.2\text{ MW}$.
   - **VIIRS NOAA-20 (`VIIRS_NOAA20_SP`):** `6` rows (`satellite="N20"`, `acq_time` in `0912`–`1054`, `confidence="h"`, `scan=0.39`, `track=0.38`, `type=0`), $\sum \text{FRP}_{\text{NOAA-20}} = 3,412.6\text{ MW}$.
   - **VIIRS NOAA-21 (`VIIRS_NOAA21_SP`):** `7` rows (`satellite="N21"`, `acq_time` in `0438`–`1020`, `confidence="h"`, `scan=0.41`, `track=0.39`, `type=0`), $\sum \text{FRP}_{\text{NOAA-21}} = 3,680.8\text{ MW}$ (including single-pixel peak `5,544.5 MW`).
   - *Naive Uncalibrated Sum:* $2,845.2 + 3,412.6 + 3,680.8 = 9,938.6\text{ MW}$ (overcounted by $3\times$).
   - *UFRS Sensor-Calibrated Mean:* $(2,845.2 + 3,412.6 + 3,680.8) / 3 = \mathbf{3,312.87\text{ MW}}$.

2. **Stage 3 Harmonised Globe Plot Object (`HarmonizedGlobe.jsx`):**
   ```json
   {
     "id": "HFE-20240724-0000",
     "d": "2024-07-24",
     "lat": 39.90980,
     "lon": -121.82287,
     "radius_m": 1000,
     "p": "Night Only",
     "pc": "N",
     "frp": 3312.87,
     "raw_n": 15,
     "sens": "MODIS + NOAA-20 + NOAA-21",
     "conf": "High",
     "c": "#bd0026",
     "st": "#7aa2f7",
     "o": 0.95
   }
   ```

3. **Stage 4 Final User-Downloadable CSV Row (`harmonized_fire_hotspots_2024-07-26.csv`):**
   ```csv
   fire_event_id,fire_date_local,first_detected_utc,last_detected_utc,latitude,longitude,fire_persistence,fire_power_mw,peak_pixel_power_mw,intensity_category,confidence_level,detections_merged,sensor_count,detecting_sensors,source_type,fire_behavior_category
   HFE-20240724-0000,2024-07-24,2024-07-25 04:38,2024-07-25 10:20,39.9098,-121.82287,Night Only,3312.87,5544.5,Extreme (250+ MW),High,15,3,MODIS + NOAA-20 + NOAA-21,Vegetation Fire,Likely Forest / Wildland Fire
   ```

### 4.2 10-Day Park Fire Daily Validation Summary (`17,817 Raw Pixels` → `1,595 Confirmed Events`)

| Local Solar Fire Day (`fire_date_local`) | Raw MODIS Pixels (`1000 m`) | Raw VIIRS NOAA-20 Pixels (`375 m`) | Raw VIIRS NOAA-21 Pixels (`375 m`) | Total Raw Pixels Merged | Harmonized `1.0 km` Events (`HFE`) | Persistent (`Day + Night`) Events | Multi-Sensor Confirmed ($\ge 2$ Sats) | Calibrated FRP (`MW`) | Uncalibrated Raw FRP Sum (`MW`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`2024-07-24`** | `270` | `895` | `1,417` | `2,582` | **`171`** | `28` | `134` | `78,412.4` | `214,890.2` |
| **`2024-07-25`** | `708` | `2,092` | `2,293` | `5,093` | **`408`** | `142` | `331` | `142,810.5` | `381,420.7` |
| **`2024-07-26`** | `546` | `1,708` | `2,156` | `4,410` | **`511`** | `118` | `389` | `114,295.1` | `292,104.5` |
| **`2024-07-27`** | `143` | `761` | `684` | `1,588` | **`124`** | `31` | `92` | `24,180.3` | `61,842.0` |
| **`2024-07-28`** | `242` | `711` | `771` | `1,724` | **`146`** | `39` | `108` | `26,940.8` | `68,112.4` |
| **`2024-07-29`** | `135` | `643` | `396` | `1,174` | **`108`** | `19` | `67` | `14,512.0` | `34,890.1` |
| **`2024-07-30` – `07-31`** | `163` | `657` | `426` | `1,246` | **`127`** | `15` | `59` | `11,900.7` | `25,703.9` |
| **10-Day Total** | **`2,207`** | **`7,467`** | **`8,143`** | **`17,817`** | **`1,595` (`11.17×` compression)** | **`392` (`24.6%`)** | **`1,180` (`74.0%`)** | **`413,051.8 MW`** | **`1,078,963.8 MW` (`2.61×` overcount)** |
