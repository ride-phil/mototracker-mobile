# Stage 2 — Session 2 Notes

**Date:** 2026-03-14
**Branch:** claude-dev (synced to main/production)

---

## Objective

Replace Traccar Manager app as the GPS notification tool. Riders currently have to install a third-party app to receive GPS waypoint hit alerts. Goal: deliver push notifications directly inside MotoTracker when a GPS waypoint hit is credited.

---

## What Was Built

### Mobile (mototracker-mobile)

#### Push Token Registration (`src/services/notifications.ts`)
- Request notification permission on login
- Create Android notification channel `default` with `MAX` importance (required for heads-up popups)
- Fetch Expo push token using EAS projectId `6cba8956-3e71-4dbf-bb8e-1a9b4dd8fab9`
- POST token to `api/v1/notifications/token`

#### Notification Tap Handling (`App.tsx`)
- `createNavigationContainerRef` for navigation from outside React tree
- `handleNotificationTap` routes by `data.type`:
  - `waypoint_hit`, `verification_accepted`, `verification_rejected` → MyProgress screen
  - `ride_launched` → RideDetail screen
- Listener registered for foreground taps + cold-start last response

#### MyProgressScreen deep-link fix
- Notification only carries `{ id: rideId }`, not the full ride object
- Screen now fetches fresh ride on mount via `getRide(rideParam.id)` so it works from both direct nav and notification tap

#### app.config.js (dynamic config)
- Converted `app.json` to `app.config.js` to support environment-based config
- `googleServicesFile` reads from `GOOGLE_SERVICES_JSON` env var (EAS secret) with local fallback
- Owns both plugins: `@rnmapbox/maps` + `expo-notifications`
- `app.json` no longer has `plugins` or `googleServicesFile`

### Backend (mototracker-laravel)

#### `app/Services/ExpoPushService.php`
- Sends to Expo push API: `https://exp.host/--/api/v2/push/send`
- `sendToUser(int $userId, string $title, string $body, array $data)` — skips gracefully if no push token
- Non-fatal: push failure never breaks calling pipeline
- Logs warnings on delivery errors from Expo

#### `app/Jobs/SendGpsWaypointHitNotificationJob.php`
- Queued job (`ShouldQueue`), 3 tries
- Loads ride name and waypoint name from DB
- Dispatches: title `"📡 GPS Waypoint Hit!"`, body `"[Ride Name] — [Waypoint Name]"`
- Data payload: `{ type: 'waypoint_hit', ride_id, waypoint_id }`

#### `app/Services/Traccar/TraccarCreditWriter.php`
- Added `SendGpsWaypointHitNotificationJob::dispatch(...)` after new `RideWaypointHit` inserted
- Only fires when hit is actually new (not a duplicate credit)

---

## Firebase / FCM Setup

- Created Firebase project: `mototracker-app`
- Downloaded `google-services.json` → added to EAS as file secret `GOOGLE_SERVICES_JSON`
- File gitignored (`google-services.json`, `GoogleService-Info.plist`)
- FCM Legacy API is disabled — uploaded Firebase Admin SDK service account JSON to Expo credentials dashboard for FCM V1

### Security Incident
`google-services.json` was briefly committed to git. Remediation:
1. `git rm --cached google-services.json`
2. Added to `.gitignore`
3. Restricted Firebase API key in Google Cloud Console to package `app.mototracker.rider` + SHA-1 fingerprint from EAS keystore

---

## Infrastructure Notes

- **Google Play emulator required** — not Google APIs; push tokens only work on Google Play image
- **Must be signed into Google account** on emulator before push tokens are available
- **Tunnel mode required** — Google Play emulator can't reach WSL via LAN; use `npx expo start --dev-client --tunnel`
- **Channel ID must stay `default`** — changing it broke heads-up popups (old channel cached)
- Foreground popups confirmed working; background (minimized) works on real device, suppressed on emulator (expected)

---

## EAS Build Notes

- Build profile used: `development` (debug + dev client)
- `cli.appVersionSource` warning in eas.json — minor, not blocking
- Preview build requested (production-like APK for real device notification testing) — pending approval

---

## End State

- GPS waypoint hit push notifications working end-to-end
- Foreground popup confirmed ✓
- Tap-to-navigate → MyProgress confirmed ✓
- `google-services.json` secured (gitignored, EAS secret, key restricted)
- Both repos clean, committed, deployed to production
