# ALPS — Agricultural Land Profiling System

**An entry for the CSFP Hackathon 2026**

A land, farmer and production registry for the **City Agriculture Office, LGU San Fernando, Pampanga**. ALPS gives agriculture officers one place to map farm parcels, maintain the farmer roster, track planting cycles, harvests, inspections, risks and assistance — and to turn all of it into reports.

> One registry, one map, one set of numbers. Every figure on the dashboard, every chart and every CSV export is derived from the same parcel registry, so a report can never disagree with the page it summarises.

---

## Why

City agriculture offices typically track parcels, farmers and assistance across spreadsheets that drift apart: the farmer list disagrees with the parcel list, the harvested area does not match the planting record, and no one can say how many hectares are actually idle. ALPS replaces that with a single relational registry behind an interactive map:

- **Land** is mapped, not typed — parcel boundaries are drawn on a map and the area in hectares is computed from the geometry, not entered by hand.
- **People are linked to land** — a farmer is assigned to the parcels they tend, and several farmers may share one parcel (the common case in the field).
- **Numbers are derived** — land status, farm activity, yields, risk insights and report exports are all folded from the same records at render time.

---

## Features

### Overview
- **Dashboard** (`/`) — the landing page doubles as the farmer directory: summary cards (total farmers, barangays covered, registered parcels, registered area), plus a farmer profile view with assistance history.
- **Agricultural Map** (`/map`) — MapLibre GL map centred on San Fernando with three modes:
  - **View** — hover or click a parcel to see its details, status legend and coordinates.
  - **Plot** — draw a new parcel polygon (terra-draw), then save it straight to the registry; the area is computed server-side from the GeoJSON.
  - **Edit** — reshape existing boundaries and update parcel attributes in place.
  - Parcels are coloured by land status (Cultivated, Preparation, Harvesting, Fallow, Idle, At Risk, Converted) with a matching legend.

### Field operations
- **Farmers** (`/farmers`) — registry with search, barangay filter, registration, profile editing, per-farmer assistance recording, and auto-generated codes (`FMR-2026-0001`).
- **Farms & Parcels** (`/farms`) — farms with summary rollups (farmers, area, status) and a parcel table; farm codes derive from the barangay (`FRM-PB01-001`), parcel codes from the year (`PLC-2026-0001`).
- **Planting & Crops** (`/crops`) — crop cycles, planted area, varieties and expected harvest schedules, with an area chart over time.
- **Harvests** (`/harvests`) — production records, yield (kg/ha), monthly output chart.
- **Inspections** (`/inspections`) — GPS-tagged field visits with risk findings, workflow status and photo documentation (upload restricted to safe media types).
- **Assistance** (`/assistance`) — seed, fertilizer, equipment, training and livelihood support released to farmers, with auto-generated reference codes (`AST-2026-0001`).
- **Risk Monitoring** (`/risks`) — risk reports with severity/status distribution, at-risk parcels, and **ALPS decision-support insights** (risk / warning / opportunity) with one-click "Create Action" that pre-fills an intervention form.

### Analytics
- **Reports & Analytics** (`/reports`) — overview cards, charts and a per-barangay breakdown, plus a **CSV export centre**: one dataset per registry (Land Status Register, Farmer Registry, Harvest Summary, Risk Report, Inspection Log, Assistance Ledger) with category chips, search and download. Exports are generated in the browser from the rows on screen, and spreadsheet-formula injection in free-text fields is neutralised.
- **Administration** (`/admin`) — system dashboard: stats, administration tools, user registry with role filters (System Admin, Agricultural Engineer, Agriculture Technician, Data Encoder) and system information. *See [Known limitations](#known-limitations).*

### Security
- JWT authentication with refresh tokens and http-only session cookies.
- Route middleware guards the registry pages and the dashboard (`auth`) and the login screen (`guest`); the Administration entry only appears in the sidebar for the `administrator` role.
- Self-registration is disabled at bootstrap; roles and API permissions are provisioned automatically on first boot.
- Upload allow-list/deny-list: documents, images, audio/video are accepted; SVG and executables are refused.

---

## Architecture

```
┌────────────────────┐        HTTP / JSON (REST)        ┌────────────────────┐
│  frontend/         │ ───────────────────────────────▶ │  backend/          │
│  Nuxt 4 (Vue 3)    │ ◀─────────────────────────────── │  Strapi 5 (TS)     │
│  Nuxt UI · Tailwind │     JWT + refresh token          │  Content API       │
│  MapLibre · ECharts │                                  │  PostgreSQL        │
└────────────────────┘                                  └────────────────────┘
```

### Tech stack

| Layer     | Stack |
|-----------|-------|
| Frontend  | Nuxt 4, Vue 3, Nuxt UI 4, Tailwind CSS 4, TypeScript |
| Mapping   | MapLibre GL, terra-draw (polygon drawing), MapTiler hybrid tiles with OpenStreetMap raster fallback, Turf.js |
| Charts    | ECharts via vue-echarts |
| Backend   | Strapi 5 (TypeScript), PostgreSQL, Turf.js for GeoJSON validation & area |
| Auth      | Strapi Users & Permissions (JWT + refresh), Nuxt route middleware |

### Data model

```
barangay 1──N farm 1──N parcel ──N farmer
                        │           │
                        │           └── farmer_status: Active | Inactive | Departed
                        ├── planting_cycle 1──N harvest
                        ├── inspections (with photos)
                        └── risk_reports
farmer 1──N assistance_program
crop 1──N planting_cycle
```

- `parcel.farmers` is authoritative ("who is tending this parcel"); `farm.farmers` is a lifecycle-managed rollup, and a farm is **Active** if at least one of its farmers is active.
- Parcel area (`area_hectares`) is computed from `boundary_geojson` on create, so the map and the tables can never disagree.
- Server-generated identifiers: `FMR-YYYY-####`, `PLC-YYYY-####`, `AST-YYYY-####`, `FRM-<barangay>-###`.

### Custom API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/api/farm-parcels/idle-at-risk` | Idle / at-risk parcels over 0.5 ha |
| `GET`  | `/api/farm-parcels/recommendations` | Rule-engine decision support for under-utilised land (priority + suggestions) |
| `POST` | `/api/farm-parcels/from-map` | Create a parcel directly from a map drawing |
| `GET`  | `/api/farmers/deep`, `/api/farmers/search` | Deep-populated farmer queries |
| `GET`  | `/api/farms`, `/api/farms/:id` (custom) | Farms with summary rollups |

---

## Getting started

### Prerequisites

- **Node.js 20–26** (see `engines` in `backend/package.json`)
- **PostgreSQL** running locally or reachable over the network
- A free **[MapTiler](https://www.maptiler.com/) API key** *(optional — the map falls back to OpenStreetMap raster tiles without it)*

### 1. Backend (Strapi, port 1337)

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_CLIENT=postgres, host/port/name/user/password,
# and fill in APP_KEYS, JWT_SECRET, ADMIN_JWT_SECRET, etc.
npm install
npm run dev
```

On first boot Strapi asks you to create the admin account for `http://localhost:1337/admin`, then provisions the `Administrator` and `Authenticated` API roles with their permissions.

Seed the registry with San Fernando barangays, sample farmers, a worked-example farm (two farmers sharing one parcel) and assistance programs:

```bash
npm run seed          # idempotent — safe to re-run
```

### 2. Frontend (Nuxt, port 3000)

```bash
cd frontend
cp .env.example .env
# Set NUXT_PUBLIC_STRAPI_URL=http://localhost:1337
# Set NUXT_PUBLIC_MAPTILER_KEY=<your key>   (optional)
npm install
npm run dev
```

Open **http://localhost:3000**.

### 3. Create a sign-in account

Public registration is disabled on purpose. In the Strapi admin panel go to
**Settings → Users & Permissions Plugin → Users → Add new user**, and assign the
**Administrator** role (this is what unlocks the `/admin` page in the app).
Then sign in at `http://localhost:3000/login`.

### Environment variables

**`backend/.env`**

| Key | Description |
|-----|-------------|
| `HOST`, `PORT` | API bind address (defaults `0.0.0.0:1337`) |
| `DATABASE_CLIENT` | `postgres` |
| `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | PostgreSQL connection |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY` | Strapi secrets — generate random values, never commit them |

**`frontend/.env`**

| Key | Description |
|-----|-------------|
| `NUXT_PUBLIC_STRAPI_URL` | Backend base URL, e.g. `http://localhost:1337` |
| `NUXT_PUBLIC_MAPTILER_KEY` | MapTiler API key (optional; OSM tiles are used when absent) |

---

## Project structure

```
alps-cicto/
├── backend/                  # Strapi 5 API
│   ├── config/               # server, admin, plugins, middleware, API config
│   ├── scripts/seed.js       # idempotent demo/seed data
│   └── src/
│       ├── index.ts          # generated fields, role & permission bootstrap
│       └── api/              # one folder per content type
│           ├── barangay/ crop/ farm/ farmer/ farm-parcel/
│           ├── harvest/ inspection/ planting-cycle/
│           ├── risk-report/ assistance-program/
│           └── ...           # controllers, routes, services, schemas, lifecycles
├── frontend/                 # Nuxt 4 app
│   └── app/
│       ├── pages/            # dashboard, map, farmers, farms, crops, harvests,
│       │                     # inspections, assistance, risks, reports, admin, login
│       ├── components/       # feature groups: map/, farms/, farmers/, crops/,
│       │                     # harvests/, inspections/, assistance/, risks/,
│       │                     # reports/, admin/ + shared primitives
│       ├── composables/      # API clients, registries, auth, drawing, filters
│       ├── middleware/       # auth, guest, admin route guards
│       └── utils/            # analytics, CSV, risk insights, formatting
└── README.md
```

### Useful scripts

| Where | Command | What it does |
|-------|---------|--------------|
| `backend` | `npm run dev` | Strapi with auto-reload |
| `backend` | `npm run build` / `npm start` | Production build / serve |
| `backend` | `npm run seed` | Seed barangays, farmers, sample farm, assistance |
| `frontend` | `npm run dev` | Nuxt dev server |
| `frontend` | `npm run build` | Production build |
| `frontend` | `npm run typecheck` | `vue-tsc` type check |

---

## Known limitations

- The **Administration** page's user registry is wired to the Users & Permissions API: create accounts, edit name/email/password/role and block/unblock, with role choices resolved from the live role list (never hardcoded). Deleting a user is still done in the Strapi admin panel.
- Administration statistics other than the live user count (database records, GIS layers, uptime) and the System Configuration / Backup / Audit Log entries are placeholders.
- Route access is enforced by the global auth middleware: every registry page requires a session, and `/admin` is additionally restricted to the `administrator` role.
- The `viewer` role is read-only in the UI: it can browse every registry, search/filter, and export CSV. Create/edit/upload/draw actions hide behind `canEdit` (administrator + authenticated), and deletion hides behind a separate `canDelete` (also administrator + authenticated only). This is presentational — the Strapi API permissions remain the source of truth for writes.
- Harvest and risk exports reflect a parcel's *current* planting cycle and risk reports (they hang off the parcel's live relations), matching exactly what the registry pages display.
- CSV is the only export format — it is generated in the browser, so no server-side PDF rendering exists yet.

---

## Team

Built for **CSFP Hackathon 2026** by:

Repository: [`github.com/ceejmangulabnan/alps-cicto`](https://github.com/ceejmangulabnan/alps-cicto) · [All contributors](https://github.com/ceejmangulabnan/alps-cicto/graphs/contributors)
