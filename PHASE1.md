# MotoTracker Mobile — Phase 1 Plan

## Overview

Android-first APK (direct install) for riders. No Play Store submission in Phase 1.
Built with React Native / Expo (TypeScript). Backend is the existing MotoTracker Laravel app.

**What this phase covers:** A rider can log in, browse and join rides, view waypoints on a map,
and submit photo or GPX evidence for waypoint verification.

**What this phase does NOT cover:**
- Live GPS tracking (Phase 2)
- Ride creation or waypoint management (coordinator/admin — web only)
- Push notifications
- iOS build

---

## Scope: Screens

| Screen | Description |
|---|---|
| Login | Email + password, stores Sanctum token |
| Ride List | Active/available rides the rider can join or has joined |
| Ride Detail | Info, waypoints on map, join button if not enrolled |
| My Progress | Rider's waypoint hits and verification status for a ride |
| Submit Verification | Camera (photo) or file picker (GPX) upload to a waypoint |
| Profile / Logout | Basic account info, sign out |

---

## Laravel API — Phase 1 Endpoints

All routes under `/api/v1/`, protected by `auth:sanctum` except login.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Email + password → returns Sanctum token |
| POST | `/api/v1/auth/logout` | Revoke current token |
| GET | `/api/v1/auth/me` | Authenticated user profile |

### Rides
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/rides` | List active/joinable rides (rider-scoped) |
| GET | `/api/v1/rides/{id}` | Ride detail (name, dates, type, description) |
| POST | `/api/v1/rides/{id}/join` | Join a ride (create RideParticipant record) |
| GET | `/api/v1/rides/{id}/waypoints` | Waypoints with lat/lng/radius for map display |
| GET | `/api/v1/rides/{id}/progress` | Rider's RideWaypointHits + pending verifications |

### Verifications
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/verifications` | Submit photo or GPX evidence for a waypoint |
| GET | `/api/v1/verifications` | List rider's own verification submissions |

---

## API Notes

- **Auth:** Laravel Sanctum token — stored securely on device, sent as `Authorization: Bearer {token}`
- **Photo upload:** `multipart/form-data` with `type=photo`, `waypoint_id`, `ride_id`, image file
- **GPX upload:** `multipart/form-data` with `type=gpx`, `waypoint_id`, `ride_id`, GPX file
- **Verification processing:** Existing pipeline unchanged — `VerificationAutoProcessor` handles it server-side
- All responses JSON, consistent envelope: `{ data: ..., message: ..., errors: ... }`

---

## Architecture: How App Talks to Backend

```
[Expo App]
    │
    │  HTTPS + Bearer token (Sanctum)
    ▼
[Laravel /api/v1/* routes]
    │
    ├── New: ApiController (thin — delegates to existing Services)
    │
    ├── Existing: VerificationAutoProcessor
    ├── Existing: WaypointCreditService
    └── Existing: TenantContextService (scoping)
```

The API layer is intentionally thin — new controllers call existing services.
No business logic lives in the mobile app or API controllers.

---

## Dev Setup Status

| Item | Status |
|---|---|
| Node 22 + npm | Ready |
| Expo project scaffolded (`blank-typescript`) | Done |
| GitHub repo (`ride-phil/mototracker-mobile`) | Done |
| EAS account created + linked to GitHub | Done |
| Expo Go installed on Android device | Done |
| EAS CLI installed + `eas init` run | Done — project ID: 6cba8956 |
| Expo tunnel dependency installed | Done |
| Laravel Sanctum installed | Done — v4.3.1, personal_access_tokens migrated |
| `/api/v1/` routes scaffolded in Laravel | Done — 10 routes, 3 controllers |

---

## Build & Test Workflow

```
Development loop:
  npx expo start --tunnel
  → scan QR with Expo Go on Android → live reload

API target:
  Phase 1: point at EC2 production URL (simplest, always reachable)
  Later: ngrok tunnel to local Laravel for pre-push testing

APK build (when ready to share):
  eas build --platform android --profile preview
  → downloads .apk, install directly on device
```

---

## Phase 2 Preview (out of scope for now)

- Background GPS tracking using `expo-location`
- Posts position to Traccar server via OsmAnd protocol (same endpoint Traccar app uses)
- Rider uses one app instead of Traccar app + MotoTracker app
- No backend changes required — Traccar pipeline unchanged

---

## Remaining Questions / Decisions

- [x] Sanctum NOT installed — must add `laravel/sanctum` before any API work
- [x] Join model is `RideParticipant` (fields: ride_id, user_id, status, joined_at)
- [ ] Decide on API base URL strategy (env var, config file)
- [x] Map library: `@rnmapbox/maps` — reuses existing Mapbox token from web app
      Note: requires native build (EAS dev build APK) — won't run in Expo Go
