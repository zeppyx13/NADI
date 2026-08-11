# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Identity

NADI (Navigasi Adaptif dan Distribusi Intelijen) is a GEMASTIK XIX 2026 smart-city prototype: an "Urban Flow Intelligence System" presented as a mobile app for tourists and the public in Bali. It shows destination occupancy, predicts crowding, recommends alternative destinations, offers fastest/safest/balanced routes, and simulates traffic incidents with rerouting.

**This is a frontend-only prototype.** There is no backend, no real authentication, and no live data. Full product rules, scope boundaries, domain model conventions, and UX guidelines live in `AGENTS.md` (imported via `@AGENTS.md` at the top of this file) — read it before making product decisions. The condensed points below are things that need repeating because they're easy to violate accidentally:

- Do not add backend services, REST/GraphQL APIs, databases, real auth, or any network request unless a task explicitly requires it. All behavior comes from local TypeScript objects, static data, and mock services in `src/mocks/` and `src/services/`.
- Simulated data must be labeled as such in the UI (`Data Simulasi`, `Skenario Demo`, `Prediksi Sistem`, `Menunggu Verifikasi Operator`) — never presented as live/official.
- Five pilot destinations only: Pantai Kuta, Ubud, Tanah Lot, Pantai Lovina, Pura Besakih. They are not interchangeable — recommendations must justify why an alternative is relevant.
- User-facing labels are Indonesian; internal field/type names are English.

## Commands

```bash
npm install                # install dependencies
npm start                  # Expo dev server (Expo Go — will NOT show the native map, see below)
npm run android             # run Android native build
npm run ios                 # run iOS native build
npm run web                  # run web build
npm run lint                 # expo lint
npx tsc --noEmit              # type-check only, no output
```

There is no automated test suite configured. After any meaningful change, run `npm run lint` and `npx tsc --noEmit`, then manually verify the affected screens/navigation (see "Testing Guidelines" in AGENTS.md for the manual checklist).

### MapLibre native map requires a dev client, not Expo Go

The map (`@maplibre/maplibre-react-native`) has native code and does not run in Expo Go. After installing deps or changing the MapLibre config plugin:

```bash
npx expo prebuild --clean
npm run ios      # or npm run android
```

For subsequent Metro sessions against the installed dev-client build:

```bash
npx expo start --dev-client --tunnel
```

`ios/` and `android/` are gitignored (generated); preserve any intentional native-only edits before running a clean prebuild.

### Environment variables (`.env`, see `.env.example`)

- `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` — optional. Powers the auth-screen hero image via `src/services/unsplash.ts`. Without it, the login/register flow falls back to the NADI brand gradient — it must remain fully usable either way.
- `EXPO_PUBLIC_MAP_STYLE_URL` — MapLibre style URL. Empty in dev falls back to the MapLibre demo style; production falls back to a local background until a real style provider is configured. Map/incident/crowd/route overlays are always local deterministic NADI data regardless of which basemap style is loaded — a real basemap does not make the data real.

## Architecture

Expo SDK 57 + Expo Router (typed routes, React Compiler enabled) + strict TypeScript. Import via `@/*` → `src/*` and `@/assets/*` → `assets/*`.

### Route structure (`src/app/`)

- `(auth)/` — login/register, presentation-only (no real auth backend).
- `(tabs)/` — main tab navigator: home (`index`), `map`, `alerts`, `profile`, `explore`.
- `itinerary/` — a multi-step itinerary flow: `create` → `manual`/`import-pdf`/`chat-input` → `preferences` → `review` → generated itinerary at `[id]`, with `[id]/reoptimize` for re-planning. This is the most complex flow in the app; trace `src/context/itinerary-context.tsx` and `src/services/itinerary-*` together before touching any one piece of it.
- `design-system-preview.tsx` — a live catalogue of design-system components/tokens; check it when adding to `src/constants/theme.ts` or `src/components/ui/`.

### Itinerary subsystem (the deepest slice in the codebase)

The itinerary feature spans several layers that must stay in sync:

- `src/context/itinerary-context.tsx` — shared state (React Context + reducer) for the in-progress itinerary flow across the multi-screen wizard.
- `src/services/itinerary-generation-service.ts` — builds an itinerary from preferences/inputs.
- `src/services/itinerary-analysis-service.ts` — evaluates/scores a generated itinerary (used against `src/data/itinerary-thresholds.ts`).
- `src/services/itinerary-narrative-service.ts` — produces user-facing explanation text for itinerary decisions.
- `src/services/itinerary-import-service.ts` — parses manual/PDF-imported itinerary input (still local — no external parsing API).
- `src/services/itinerary-service.ts` — orchestration/entry point tying the above together.
- `src/storage/itinerary-storage.ts` — persistence (local) for saved itineraries.
- `src/data/itinerary-scenarios.ts` / `itinerary-thresholds.ts` — deterministic scenario and threshold data driving generation/analysis so demos are reproducible.

When changing itinerary behavior, check whether generation, analysis, narrative, and storage all need the corresponding update — they are deliberately separate services rather than one large module.

### Other key directories

- `src/data/` — static destination/scenario datasets (`destinations.ts`, `alerts.ts`, `home.ts`), the demo dataset of record.
- `src/mocks/` — mock async services simulating backend-like behavior (e.g. `home-dashboard.ts`).
- `src/storage/` — local persistence wrappers (AsyncStorage-backed caches: auth hero image, destination images, recent destinations, itineraries).
- `src/services/unsplash.ts` — the one piece of code that makes a real network call (Unsplash API for hero images), and only as a cosmetic, optional fallback-safe enhancement — not a precedent for adding other network calls.
- `src/i18n/` — i18next setup (`index.ts`, `storage.ts`, `types.ts`) with `locales/en` and `locales/id`; UI strings are Indonesian by default per AGENTS.md.
- `src/constants/theme.ts` — the design-token source of truth (colors, spacing, radii, typography, shadows, status/occupancy colors); components must consume tokens from here rather than hardcoding values.
- `src/components/` — organized by domain (`destination/`, `route/`, `incident/`, `itinerary/`, `map/` with `layers/` for map overlay layers, `alerts/`, `auth/`, `home/`, `profile/`, `status/`, `navigation/`, `layout/`, `media/`) plus a shared `ui/` kit.

## Documentation requirement

Per AGENTS.md, every change must be reported and documented in `docs/changes/`, written in Bahasa Indonesia, describing what changed and its impact on the rest of the project.
