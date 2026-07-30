# Repository Guidelines

## Project Identity

NADI stands for **Navigasi Adaptif dan Distribusi Intelijen**. It is a smart-city prototype for GEMASTIK XIX 2026, focused on helping tourists and the public understand destination conditions, receive relevant alternative destination recommendations, choose safer routes, and respond to simulated traffic incidents.

NADI is not intended to be a generic tourism application. Its product identity is an **Urban Flow Intelligence System** presented through a mobile application.

The prototype should demonstrate how city data can support the following decision flow:

1. Observe destination and traffic conditions.
2. Predict destination occupancy when the user arrives.
3. Recommend relevant alternative destinations.
4. Offer fastest, safest, and balanced routes.
5. Detect or simulate an incident on the selected route.
6. Reroute the user and update public information.
7. Show that the incident would be forwarded to an operator for verification.

The current repository contains the **public-facing mobile application only**.

---

## Current Development Scope

The current phase prioritizes a visually complete and convincing mobile prototype for GEMASTIK.

### In Scope

- Mobile application for tourists and general users.
- Login and registration screens.
- Home dashboard.
- Interactive tourism map.
- Destination information.
- Destination occupancy status.
- Predicted occupancy at estimated arrival time.
- Alternative destination recommendations.
- Fastest, safest, and balanced route options.
- Simulated congestion and traffic incidents.
- Incident alerts and route changes.
- User profile and application settings.
- Local mock data and predefined demonstration scenarios.
- Labels that clearly distinguish simulation data from real data.

### Out of Scope

Do not implement the following unless explicitly requested:

- Backend services.
- REST or GraphQL APIs.
- Database integration.
- Firebase or Supabase.
- Real authentication.
- Real user registration.
- Admin or operator web dashboard.
- CCTV stream processing.
- Machine-learning model execution.
- Real-time accident detection.
- Call Center 112 integration.
- Police, ambulance, or hospital integration.
- ATCS control.
- Physical SIGMA sign integration.
- Real navigation or routing APIs.
- Production deployment infrastructure.

Do not add backend abstractions in anticipation of future work. The immediate goal is a focused mobile prototype.

---

## Prototype Constraints

This application is currently a **frontend-only prototype**.

All application behavior must use:

- Local TypeScript objects.
- Static JSON files.
- Mock service functions.
- Predefined scenarios.
- Local assets.
- Simulated loading delays only when they improve the demonstration.

Do not make network requests unless a task explicitly requires them.

Login and registration screens are presentation-only. They may validate basic form input, but they must not connect to an authentication service. A successful demo action should navigate directly into the application.

Use terms such as:

- `Data Simulasi`
- `Skenario Demo`
- `Prediksi Sistem`
- `Menunggu Verifikasi Operator`

Do not present simulated values as official, live, or government-provided data.

---

## Target Users

The current application serves:

- Domestic tourists.
- International tourists.
- Bali residents.
- General road and tourism information users.

The application does not currently provide an operator role.

A future operator web application may support:

- Incident verification.
- CCTV event monitoring.
- Destination condition monitoring.
- Traffic condition monitoring.
- Smart-sign control.
- Emergency coordination.

The mobile application may display an incident status such as `Menunggu Verifikasi Operator`, but it must not implement the operator interface.

---

## Pilot Destinations

Use the following five destinations as the primary prototype dataset:

1. **Pantai Kuta** — Badung, South Bali.
2. **Ubud** — Gianyar, Central Bali.
3. **Tanah Lot** — Tabanan, West-Central Bali.
4. **Pantai Lovina** — Buleleng, North Bali.
5. **Pura Besakih** — Karangasem, East Bali.

These destinations are intentionally distributed across Bali and must not be treated as automatically interchangeable.

Alternative destination recommendations should consider simulated factors such as:

- Destination category.
- User preference.
- Occupancy level.
- Predicted arrival condition.
- Travel duration.
- Route risk.
- Parking availability.
- Accessibility.
- Cultural or tourism experience.

For example, the system should not recommend Pura Besakih as a direct substitute for Pantai Kuta without a clear explanation of why it is relevant.

---

## Core Demonstration Scenario

The primary prototype flow should remain consistent across screens:

1. The user opens NADI.
2. The user passes through the login or registration interface.
3. The user views tourism and mobility conditions on the home screen.
4. The user selects a popular destination.
5. NADI displays its current and predicted occupancy.
6. The destination is predicted to become crowded at the user's arrival time.
7. NADI provides relevant alternative destinations.
8. The user selects a destination.
9. NADI displays three route modes:
   - Fastest.
   - Safest.
   - Balanced.
10. A simulated accident or road obstruction occurs.
11. NADI displays an incident alert.
12. The selected route is recalculated using mock data.
13. The user receives a safer alternative route.
14. The incident is shown as forwarded for operator verification.

New features should support this flow rather than introduce unrelated product areas.

---

## Product Priorities

When trade-offs are necessary, follow this order:

1. Clear end-to-end user flow.
2. Visual quality and presentation readiness.
3. Consistency between screens.
4. Correct simulation behavior.
5. Reusable component structure.
6. Accessibility and readability.
7. Performance.
8. Production-level architecture.

Do not sacrifice prototype completion by adding unnecessary infrastructure.

Prefer a smaller polished feature over a broad but incomplete implementation.

---

## Repository Structure and Module Organization

NADI is an Expo SDK 57 application using Expo Router and strict TypeScript.

Use the following organization:

```text
src/
├── app/                 # Expo Router routes and navigation layouts
├── components/          # Reusable UI components
├── constants/           # Theme, spacing, typography, and fixed configuration
├── data/                # Static destination and scenario data
├── hooks/               # Shared React hooks
├── mocks/               # Mock services and scenario simulation
├── types/               # Shared TypeScript types
├── utils/               # Pure helper functions
└── context/             # Shared prototype state when needed

assets/
├── images/
├── icons/
└── fonts/

scripts/
```

Routes live in `src/app/`.

The root `_layout.tsx` defines shared navigation. Files and folders inside `src/app/` become routes according to Expo Router conventions.

Reusable UI belongs in `src/components/`.

Shared design values belong in `src/constants/`.

Static destination records should be placed in `src/data/`.

Mocked asynchronous behavior and scenario transitions should be placed in `src/mocks/`.

Shared domain interfaces should be placed in `src/types/`.

Use the `@/` alias for imports from `src` and `@/assets/` for assets.

Keep platform-specific implementations adjacent using suffixes such as:

- `.android.tsx`
- `.ios.tsx`
- `.web.tsx`

Do not create platform-specific files unless behavior genuinely differs.

---

## Suggested Route Organization

Use route groups when they improve navigation clarity.

A suitable structure may include:

```text
src/app/
├── _layout.tsx
├── index.tsx
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── home.tsx
│   ├── map.tsx
│   ├── alerts.tsx
│   └── profile.tsx
├── destination/
│   └── [id].tsx
├── recommendation/
│   └── index.tsx
└── route/
    └── [id].tsx
```

This is a guideline, not a requirement. Preserve existing working navigation and avoid unnecessary route restructuring.

---

## Domain Model Guidelines

Use explicit shared types for important product entities.

Recommended entities include:

- `Destination`
- `DestinationCategory`
- `DestinationStatus`
- `OccupancyLevel`
- `OccupancyPrediction`
- `DestinationRecommendation`
- `RouteOption`
- `RouteMode`
- `TrafficCondition`
- `Incident`
- `IncidentStatus`
- `DemoScenario`
- `UserPreference`

Avoid loosely typed objects and avoid using `any`.

Example route modes:

```ts
export type RouteMode = "fastest" | "safest" | "balanced";
```

Example occupancy levels:

```ts
export type OccupancyLevel = "low" | "moderate" | "high" | "critical";
```

Example incident statuses:

```ts
export type IncidentStatus =
  | "detected"
  | "awaiting_verification"
  | "verified"
  | "resolved";
```

Keep labels shown to users in Indonesian, while internal field names and TypeScript types should use English.

---

## Mock Data and Scenario Rules

Mock data must be deterministic enough for demonstrations.

Do not generate important values randomly on every render. Random behavior can make the demonstration inconsistent and difficult to reproduce.

Each demonstration scenario should define:

- Active destination conditions.
- Current occupancy.
- Predicted occupancy.
- Traffic conditions.
- Route alternatives.
- Incident location.
- Incident severity.
- Incident verification status.
- Rerouting result.
- User-facing explanation.

Prefer a centralized scenario definition rather than duplicating mock values across screens.

For shared prototype state, prefer React Context with `useReducer` unless the repository already includes a suitable state-management library.

Do not install a new global state library only for simple prototype state.

---

## Recommendation Rules

Recommendations must not be based only on destination popularity.

Each recommendation card should be able to explain why a destination was suggested.

Possible explanation factors include:

- Similar experience.
- Lower predicted occupancy.
- Safer access route.
- Available parking.
- Shorter queue.
- Better accessibility.
- More balanced tourism distribution.

Example user-facing explanation:

> Pantai Kuta diprediksi mencapai kepadatan tinggi saat Anda tiba. Pantai Lovina memiliki kondisi lebih lengang, parkir tersedia, dan tingkat risiko rute lebih rendah.

Do not claim that recommendation scores are produced by a real AI model while the application still uses mock data.

---

## Route Simulation Rules

The application should support three conceptual route modes:

### Fastest Route

Prioritizes:

- Shortest simulated travel duration.
- Direct access.
- Lower traffic delay.

### Safest Route

Prioritizes:

- Lower simulated road risk.
- Fewer incident points.
- Lower congestion.
- Safer road conditions.

### Balanced Route

Balances:

- Travel duration.
- Traffic condition.
- Route safety.
- Destination occupancy.

All route values are currently simulated.

Route visualization may use local coordinates and predefined polylines.

Do not integrate paid routing, geocoding, or navigation services unless explicitly requested.

---

## Map Implementation

For the prototype, prefer `react-native-maps` when a native map is required.

Install Expo-compatible native packages using:

```bash
npx expo install react-native-maps
```

The map may display:

- User location marker or simulated starting position.
- Five destination markers.
- Destination occupancy indicators.
- Incident markers.
- Route polylines.
- Selected route state.
- Map callouts.
- Recenter control.

The map must still have a graceful fallback when location permission is unavailable. Do not make device location mandatory for accessing the prototype.

Avoid implementing full turn-by-turn navigation.

---

## UI and UX Principles

The application should feel like a modern tourism and smart-mobility product, not an administrative dashboard.

Prioritize:

- Clear visual hierarchy.
- Large touch targets.
- Readable typography.
- Strong destination imagery.
- Simple status indicators.
- Short explanations.
- Visible primary actions.
- Consistent cards, spacing, and icons.
- Mobile-first layouts.

Use progressive disclosure. Do not show every technical metric on the main screen.

Technical values such as confidence scores, traffic indexes, or route-risk scores should appear only when they help users understand a recommendation.

Avoid exposing raw AI terminology to general users without an explanation.

Prefer:

- `Risiko Rute Rendah`

Over:

- `Risk score: 0.24`

Every major simulation-based component should include a subtle but visible simulation label.

---

## Design System

Use centralized tokens from `src/constants/theme.ts`.

Do not duplicate:

- Colors.
- Spacing values.
- Border radii.
- Typography sizes.
- Shadows.
- Status colors.

Create reusable semantic tokens for:

- Primary brand color.
- Secondary brand color.
- Background.
- Surface.
- Text primary.
- Text secondary.
- Success.
- Warning.
- Danger.
- Information.
- Low occupancy.
- Moderate occupancy.
- High occupancy.
- Critical occupancy.

Do not hardcode design values repeatedly inside route components.

Shared visual patterns should become reusable components, such as:

- `DestinationCard`
- `OccupancyBadge`
- `SimulationBadge`
- `RouteOptionCard`
- `IncidentAlert`
- `SectionHeader`
- `StatusIndicator`
- `EmptyState`
- `LoadingState`

Avoid creating a component for trivial markup used only once.

---

## Accessibility

Use accessible labels for important controls.

Maintain sufficient text contrast.

Do not communicate occupancy, route risk, or incident severity through color alone. Combine color with text, icons, or labels.

Support reasonable text scaling and avoid fixed-height containers that clip translated or enlarged text.

Use Indonesian as the primary interface language unless a specific multilingual task is requested.

---

## Build, Test, and Development Commands

- `npm install`: install locked dependency versions.
- `npm start`: launch the Expo development server.
- `npm run android`: start the Android application.
- `npm run ios`: start the iOS application.
- `npm run web`: start the web version when applicable.
- `npm run lint`: run Expo's configured lint checks.
- `npx tsc --noEmit`: type-check the project without producing files.
- `npm run reset-project`: reset starter content.

The reset command is destructive. Inspect `scripts/reset-project.js` before running it.

Use Node.js 22.13 or newer, as required by the current project configuration.

---

## Coding Style and Naming Conventions

- Two-space indentation.
- Single quotes.
- Semicolons.
- Trailing commas in multiline objects.
- Strict TypeScript.
- Function components.
- Hooks for reusablce stateful behavior.

Naming conventions:

- React components: `PascalCase`
- Functions and variables: `camelCase`
- Hooks: prefix with `use`
- Types and interfaces: `PascalCase`
- Constants: use descriptive camelCase or `UPPER_SNAKE_CASE` for true global constants
- Component filenames: kebab-case
- Route filenames: follow Expo Router conventions

Examples:

```text
destination-card.tsx
route-option-card.tsx
use-demo-scenario.ts
destination.ts
```

Use named exports for shared components and utilities unless Expo Router requires a default export for a route.

Do not use `any` unless a third-party library provides no practical alternative. Document the reason when it is unavoidable.

---

## Component and Screen Responsibilities

Route files should focus on:

- Screen composition.
- Navigation.
- Route parameters.
- High-level state selection.

Move reusable logic into:

- Hooks.
- Utilities.
- Context.
- Mock services.
- Shared components.

Avoid placing large datasets directly inside screen components.

Avoid performing scenario calculations inline during JSX rendering.

Keep components focused, but do not split a screen into excessive one-line components.

---

## Error and Loading States

Even though data is local, screens should handle:

- Missing destination IDs.
- Empty recommendation lists.
- Missing images.
- Invalid route parameters.
- Unavailable simulated location.
- Loading transitions.
- Scenario reset.

Do not leave users on a blank screen when mock data cannot be found.

Provide a safe fallback and a way to return to the previous screen.

---

## Testing Guidelines

No automated test command or coverage threshold is currently configured.

For every meaningful change, run:

```bash
npm run lint
npx tsc --noEmit
```

Then manually verify affected navigation and screens.

At minimum, manually verify:

- Application startup.
- Login-to-home navigation.
- Registration-to-home navigation.
- Tab navigation.
- Destination selection.
- Destination detail rendering.
- Recommendation selection.
- Route mode selection.
- Incident scenario activation.
- Rerouting state.
- Back navigation.
- Layout on common mobile screen sizes.

If adding tests:

- Place them beside the implementation as `*.test.ts` or `*.test.tsx`.
- Add the test runner to `package.json`.
- Test user-visible behavior instead of implementation details.
- Prioritize pure recommendation, formatting, and scenario-transition functions.

Do not introduce a complex testing framework unless the feature justifies it.

---

## Performance Guidelines

Avoid unnecessary re-renders of maps and large lists.

Use memoization only when there is an observable benefit.

For lists, use `FlatList` or `SectionList` when the number of rendered items can grow.

Optimize large local images before adding them to the repository.

Do not add large video files directly unless required for the competition demonstration.

Prefer local assets for predictable demo behavior.

---

## Dependency Guidelines

Before adding a dependency:

1. Check whether the requirement can be handled with React Native or Expo APIs.
2. Confirm compatibility with Expo SDK 57.
3. Install compatible native dependencies using `npx expo install`.
4. Avoid packages that require unnecessary native configuration.
5. Avoid multiple libraries that solve the same problem.

Do not replace existing navigation, styling, icon, or state-management solutions without a clear reason.

---

## Expo SDK 57 Requirement

Expo APIs and package compatibility can change between SDK versions.

Before writing code that depends on Expo behavior, consult the exact Expo SDK 57 documentation:

`https://docs.expo.dev/versions/v57.0.0/`

Install compatible native packages using:

```bash
npx expo install <package>
```

Do not manually select native package versions when Expo provides a compatible installer.

---

## Agent Working Rules

Before modifying the repository:

1. Inspect the current project structure.
2. Read the relevant existing files.
3. Reuse existing components and design tokens.
4. Identify whether the requested feature belongs to the current prototype scope.
5. Avoid unrelated refactoring.
6. Preserve working navigation.
7. Keep the implementation small enough to verify.

When implementing a feature:

- State the planned files before making broad changes.
- Keep changes focused on the requested task.
- Do not silently add backend or authentication infrastructure.
- Do not replace mock data with network data.
- Do not claim an integration exists when it is simulated.
- Preserve strict TypeScript.
- Run lint and type checks after implementation.
- Report any remaining warnings or unverified platform behavior honestly.

When requirements are ambiguous, prefer the option that:

1. Supports the primary GEMASTIK demo flow.
2. Requires less infrastructure.
3. Is easier for one developer to maintain.
4. Produces a more polished prototype.

Do not overengineer the application.

---

## Commit and Pull Request Guidelines

Use concise, imperative commit subjects.

Examples:

```text
Add destination occupancy cards
Build simulated route selection
Add incident rerouting scenario
Create tourism map markers
Improve login prototype flow
```

Keep commits focused on one logical change.

Pull requests should include:

- User-visible changes.
- Main implementation decisions.
- Files or modules affected.
- Verification performed.
- Known limitations.
- Screenshots or recordings for UI changes.
- Simulation assumptions when relevant.

Do not describe simulated integrations as production-ready functionality.
