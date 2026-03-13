# MotoTracker — Stage 2, Session 1 Notes

**Date:** 2026-03-13
**Repos touched:** `mototracker-mobile` (main), `mototracker-laravel` (claude-dev → production)

---

## Session Summary

This session kicked off Stage 2 work. Covered four major areas:
1. Expired ride visibility fixes across all three role views (Admin / Coordinator / Rider)
2. Fix dangerous cascade delete: deleting a coordinator user was wiping all their rides
3. Feature 2.1 — Public Rider Profiles (tappable leaderboard rows)
4. Native package setup + EAS dev build trigger for push notifications

---

## 1. Expired Ride Visibility

### Problem
- **Rider** — expired rides not shown anywhere in "My Rides"; riders lose all history
- **Coordinator** — expired rides not shown on Managed Rides; RCs lose visibility of their own events
- **Admin** — already had "Show expired" toggle; wanted parity across all roles

### Changes

#### Rider (`/rider/rides`)
- `Rider/RideController.php` — `index()` now accepts `show_expired=1` query param
  - On `type=joined` tab, conditionally includes `expired` in status filter
  - `show()` method: also allows expired rides (alongside cancelled) for participant-only visibility
- `resources/views/rider/rides/index.blade.php`
  - "Show expired / Hide expired" toggle button — only shown on the `joined` tab
  - Toggle preserves `type=joined` in URL

#### Coordinator (`/managed-rides`)
- `Coordinator/ManagedRideController.php` — hides expired by default, `show_expired=1` reveals them
- `resources/views/coordinator/managed-rides/index.blade.php`
  - "Show expired rides / Hide expired rides" toggle alongside existing cancelled toggle
  - Both toggles preserve each other's state via `array_filter()` on the URL params

---

## 2. Cascade Delete Fix — Coordinator Profiles → Rides

### Problem
Delete chain: `users` → `coordinator_profiles` (`cascadeOnDelete`) → `rides` (`cascadeOnDelete`)
Deleting a user wiped all their rides and all associated event data. Discovered when `rc@ridephilippines.com` was deleted and "Greenwoods RC GPS Test" (ride 49) disappeared.

### Root Cause Investigation
- Ride 49 was still in the database — `nullOnDelete` migration had already run
- Ride was showing in the mobile leaderboard because `LeaderboardService` includes
  expired rides from the last 90 days. Not a bug.
- All tinker debugging was running against LOCAL database (8 rides). Production had 10.
  Always SSH to EC2 for authoritative production checks.

### Fix
`2026_03_13_114139_fix_rides_coordinator_profile_cascade.php`:
- Changed `rides.coordinator_profile_id` FK from `cascadeOnDelete` to `nullOnDelete`
- Column made nullable (required — MySQL won't allow `ON DELETE SET NULL` on NOT NULL column)
- Migration is idempotent: checks `INFORMATION_SCHEMA.KEY_COLUMN_USAGE` before dropping the FK
  (necessary because a partial earlier migration attempt had already dropped it without re-adding)

### Admin UI
`resources/views/admin/rides/show.blade.php` — Ride Participants `<details>` section
updated to match Waypoint Sync Status style: `group` class, `▼` arrow with `group-open:rotate-180`.

---

## 3. Feature 2.1 — Public Rider Profiles

### Backend
- New controller: `app/Http/Controllers/Api/V1/RiderProfileController.php`
- New route: `GET /api/v1/riders/{userId}`
- Returns: name, username, avatar_url, bio, location, bike, riding_style, riding_club,
  social links (facebook, instagram, tiktok, website), and a `stats` object:
  `total_rides, waypoint_credits, gps_credits, accepted_photo_submissions, accepted_gpx_submissions`

### Mobile
- `src/services/leaderboard.ts` — added `RiderProfile` interface and `getRiderProfile(userId)`
- `src/components/LeaderboardModal.tsx` — added a third "level" (ride index → per-ride rankings → rider profile)
  - Leaderboard rows now tappable (`onPress` → `handleSelectRider`)
  - Profile view: 88px avatar with blue ring, name, @username, location, bio card,
    bike/style/club card, 5-stat grid, social link buttons via `Linking.openURL`
  - `handleBack()` updated for three-level navigation
  - Modal title shows rider name at profile level

---

## 4. Push Notification Setup (EAS Build Foundation)

### Packages Installed
```bash
npx expo install expo-notifications react-native-gesture-handler react-native-reanimated
```
All three are native modules — a new EAS dev client build is required (triggered at end of session).

### Mobile Changes

**`src/services/notifications.ts`** (new file)
- Sets notification handler for foreground presentation (alert + sound + badge)
- `registerPushToken()`:
  1. Requests permission (silent fail if denied — doesn't block app)
  2. Creates Android notification channel (`MotoTracker`, MAX importance, blue `#38bdf8`)
  3. Gets Expo push token using `projectId: '6cba8956-3e71-4dbf-bb8e-1a9b4dd8fab9'`
  4. POSTs token to `POST /api/v1/notifications/token`

**`App.tsx`**
- Import added: `import { registerPushToken } from './src/services/notifications'`
- New `useEffect` triggers `registerPushToken()` whenever `user` becomes non-null
  (covers both initial login and app restart with stored session)

**`app.json`**
- Added android permissions: `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, `POST_NOTIFICATIONS`
- Added `expo-notifications` plugin: `icon: ./assets/notification-icon.png`, `color: #38bdf8`
- `assets/notification-icon.png` created (copy of monochrome icon)

**`babel.config.js`**
- Added `plugins: ['react-native-reanimated/plugin']` (required by reanimated)

### Laravel Backend (deployed to production)

**Migration:** `2026_03_13_121144_add_push_token_to_users_table.php`
- Adds `push_token` nullable string column to `users` table (after `remember_token`)

**Controller:** `app/Http/Controllers/Api/V1/NotificationController.php`
- `storeToken()` — validates token (string, max 500), calls `$request->user()->update(['push_token' => ...])`

**Route:** `POST /api/v1/notifications/token` (authenticated, inside `auth:sanctum` group)

**Model:** `User::$fillable` — `push_token` added

### EAS Build
```bash
eas build --profile development --platform android
```
Build queued on Expo free tier. Track at:
`https://expo.dev/accounts/mototracker/projects/mototracker-mobile/builds`

---

## API Endpoints Added This Session

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/v1/riders/{userId}` | Public rider profile |
| `POST` | `/api/v1/notifications/token` | Register Expo push token |

---

## Files Changed This Session

### mototracker-laravel
| File | Change |
|---|---|
| `app/Http/Controllers/Rider/RideController.php` | show_expired toggle, expired visibility for participants |
| `resources/views/rider/rides/index.blade.php` | "Show expired" toggle button on joined tab |
| `app/Http/Controllers/Coordinator/ManagedRideController.php` | show_expired toggle |
| `resources/views/coordinator/managed-rides/index.blade.php` | "Show expired rides" toggle |
| `resources/views/admin/rides/show.blade.php` | Ride Participants expand arrow fix |
| `database/migrations/2026_03_13_114139_fix_rides_coordinator_profile_cascade.php` | nullOnDelete fix + idempotent FK check |
| `app/Http/Controllers/Api/V1/RiderProfileController.php` | NEW — public rider profile endpoint |
| `app/Http/Controllers/Api/V1/NotificationController.php` | NEW — push token store |
| `database/migrations/2026_03_13_121144_add_push_token_to_users_table.php` | NEW — push_token column |
| `app/Models/User.php` | push_token added to fillable |
| `routes/api.php` | Two new routes added |

### mototracker-mobile
| File | Change |
|---|---|
| `src/services/leaderboard.ts` | RiderProfile interface + getRiderProfile() |
| `src/components/LeaderboardModal.tsx` | Third level (rider profile view) |
| `src/services/notifications.ts` | NEW — push token registration |
| `App.tsx` | registerPushToken() wired on auth |
| `app.json` | Android permissions + expo-notifications plugin |
| `babel.config.js` | reanimated plugin |
| `assets/notification-icon.png` | NEW |
| `package.json` / `package-lock.json` | Three new native packages |

---

## Pending / Next Session

- **Notification listeners**: `addNotificationReceivedListener` and `addNotificationResponseReceivedListener`
  in App.tsx to handle taps on push notifications and navigate to the relevant screen
- **Laravel notification dispatchers**: Observers/listeners to send push notifications on:
  - Verification accepted
  - Verification rejected
  - Waypoint GPS hit
  - New ride launched
- **GitHub Issue #8**: Admin UI to reassign `coordinator_profile_id` when NULL
- **Feature 1.2**: Ride Diagnostics Screen (backend endpoint + mobile screen)
- **Feature 1.3**: Top Riders all-time leaderboard tab
- **Feature 1.4**: Avatar upload wired in EditProfileScreen
- **Install new dev client APK** from EAS build once it completes

---

## Key Gotchas Learned This Session

1. **Local vs production DB** — always SSH to EC2 for production queries. `php artisan tinker` locally hits the local DB which may have stale/missing data.
2. **MySQL ON DELETE SET NULL requires nullable column** — cannot add `nullOnDelete` FK to a NOT NULL column. Must `->nullable()->change()` first.
3. **Partial migration failures leave inconsistent state** — if a migration fails partway through (no transaction), a second attempt may try to drop an already-dropped FK. Use `INFORMATION_SCHEMA` check to make migrations idempotent.
4. **LeaderboardService includes expired rides** — last 90 days of expired rides show in the leaderboard by design. Not a bug; confirmed in `LeaderboardService`.
5. **`deploy.sh` not in production** — deploy via SSH direct: `git pull origin production && php artisan migrate --force && php artisan config:cache && php artisan route:cache`
