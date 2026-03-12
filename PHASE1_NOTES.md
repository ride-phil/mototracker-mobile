# MotoTracker Mobile — Phase 1 Build Notes

## Overview
React Native / Expo mobile app for MotoTracker riders. Android-first, iOS later.
Phase 1 covers: auth, ride browsing, GPS onboarding, evidence submission, and progress tracking.

---

## Tech Stack

| Item | Choice |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript |
| Navigation | @react-navigation/native-stack |
| Maps | @rnmapbox/maps (streets-v12 style) |
| Auth | Laravel Sanctum (stateless token) |
| Storage | @react-native-async-storage/async-storage |
| Builds | EAS (Expo Application Services) |
| Backend | Laravel 12 API at https://app.mototracker.app/api/v1 |

---

## Repo

- **Mobile:** https://github.com/ride-phil/mototracker-mobile (branch: `main`)
- **Backend:** mototracker-laravel (branch: `production`, API on `mobile-dev` merged in)

---

## Native Packages (require EAS build to update)

```
@rnmapbox/maps
expo-dev-client
expo-document-picker
expo-image-picker
expo-file-system
expo-sharing
expo-clipboard
```

> Any time a new native package is added, a new EAS build is required.
> Pure JS/TS changes can be tested via Metro tunnel with the dev client APK.

---

## EAS Build Profiles

| Profile | Output | Use for |
|---|---|---|
| `development` | APK (dev client) | Live reload dev workflow via Metro tunnel |
| `preview` | APK | Testing / sharing with riders |
| `production` | AAB | Play Store release |

**Free tier: 30 builds/month.** Resets monthly.
Only build when native packages change. Use dev client + tunnel for all JS changes.

### Dev Client Workflow (when it works)
```bash
cd ~/mototracker-mobile
npx expo start --tunnel --dev-client
```
In the dev client app → Enter URL manually → paste the `https://` tunnel URL from terminal output.

---

## EAS Environment Variables (Secrets)

| Key | Purpose |
|---|---|
| `MAPBOX_TOKEN` | Public `pk.*` token — runtime map display |
| `MAPBOX_DOWNLOAD_TOKEN` | Secret `sk.*` token with DOWNLOADS:READ — build-time SDK download |

Set via: `eas env:create --scope project --name KEY --value VALUE --environment preview`

---

## Backend API — Base URL
```
https://app.mototracker.app/api/v1
```
All routes require `Authorization: Bearer <token>` except `/auth/login`.

### Endpoints

#### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Email/password → returns token |
| POST | `/auth/logout` | Revoke token |
| GET | `/auth/me` | Authenticated user info |

#### Rides
| Method | Path | Description |
|---|---|---|
| GET | `/rides` | List active public rides |
| GET | `/rides/{id}` | Single ride detail |
| POST | `/rides/{id}/join` | Join a ride |
| DELETE | `/rides/{id}/leave` | Leave a ride |
| GET | `/rides/{id}/waypoints` | Waypoints with lat/lng |
| GET | `/rides/{id}/gpx` | Download GPX file |
| GET | `/rides/{id}/progress` | Rider's hits + pending verifications |

#### Onboarding / GPS Setup
| Method | Path | Description |
|---|---|---|
| GET | `/onboarding/status` | Full GPS setup state + credentials |
| POST | `/onboarding/account` | Create Traccar GPS account |
| POST | `/onboarding/device` | Generate MT device ID and provision |

#### Verifications
| Method | Path | Description |
|---|---|---|
| GET | `/verifications` | Rider's submissions |
| POST | `/verifications` | Submit photo or GPX evidence (multipart) |

---

## Screens

| Screen | Route | Notes |
|---|---|---|
| Login | (auth gate) | Email/password, Sanctum token stored in AsyncStorage |
| RideList | `RideList` | Featured image, status badge, location, completion bar, join button |
| RideDetail | `RideDetail` | Image, schedule, progress card, join/leave, GPX download, map, waypoints with directions |
| SubmitVerification | `SubmitVerification` | Waypoint selector, photo/GPX toggle, camera/library/file picker |
| MyProgress | `MyProgress` | Hits, pending, completion %, points card (X of Y Max) |
| Profile | `Profile` | Avatar, name/email/role, sign out |
| Onboarding | `Onboarding` | 4-step GPS setup: account → device ID → Traccar Client → signal check |

---

## Components

| Component | Purpose |
|---|---|
| `AppHeader` | Header with hamburger or back button, centered title |
| `DrawerMenu` | Animated slide-in drawer (Rides, GPS Setup, Profile) |

---

## Services (src/services/)

| File | Exports |
|---|---|
| `api.ts` | Base fetch wrapper with Bearer token (get, post, delete) |
| `auth.ts` | login(), logout(), getStoredUser() |
| `rides.ts` | getRides(), joinRide(), leaveRide(), getWaypoints(), downloadAndShareGpx() |
| `progress.ts` | getRideProgress() |
| `verifications.ts` | submitVerification() multipart |
| `onboarding.ts` | getOnboardingStatus(), createGpsAccount(), createDevice() |

---

## Ride Data Shape (key fields)

```ts
interface Ride {
  id, name, description, type, status, location
  featured_image    // full URL via asset('storage/...')
  start_date        // maps to start_at on Ride model
  end_date          // maps to end_at on Ride model
  is_joined
  total_waypoints
  hit_count
  completion_pct
}
```

---

## Known Issues / Gotchas

- **Mapbox two-token architecture**: `pk.*` for runtime display, `sk.*` (DOWNLOADS:READ) for build-time SDK download. Never use `pk.*` as the download token.
- **GitHub secret scanning**: Mapbox public token in committed files triggers GitHub secret scanning. Keep tokens in `app.config.js` reading from `process.env` / EAS secrets only.
- **SDK version**: App targets Expo SDK 54. Do not upgrade without testing — Expo Go on device must match.
- **Ride model columns**: Backend uses `start_at` / `end_at`, exposed to mobile as `start_date` / `end_date`.
- **Dev client + new native modules**: Dev client APK must be rebuilt whenever a new native package is added. JS-only changes hot-reload fine.
- **`eas secret:create` is deprecated**: Use `eas env:create` instead.
- **`eas-cli` install path**: Installed to `~/.local/bin` due to npm permission issues on WSL2.

---

## Phase 2 Candidates

- iOS build and TestFlight distribution
- Push notifications (waypoint hit confirmations, ride status changes)
- Live GPS tracking screen (map showing rider's current position vs waypoints)
- Traccar Client deep-link / in-app tracking toggle
- Leaderboard screen
- Ride history / past rides
- Coordinator mobile view (read-only ride management)
