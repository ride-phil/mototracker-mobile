# MotoTracker Mobile — Stage 1 Coding Notes

Technical reference for the Stage 1 build. Covers architecture decisions,
file inventory, API contracts, known gotchas, and dev workflow.

---

## Tech Stack

| Layer | Library | Notes |
|---|---|---|
| Framework | Expo (managed workflow) | SDK 52 |
| Language | TypeScript | Strict mode |
| Navigation | `@react-navigation/native` + `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` | No drawer nav — see gotchas |
| Maps | `@rnmapbox/maps` | Mapbox GL, token via `app.json` extra |
| HTTP | `axios` | Thin wrapper in `src/services/api.ts` |
| Auth storage | `@react-native-async-storage/async-storage` | Token stored as `auth_token` |
| Safe area | `react-native-safe-area-context` | Use `<SafeAreaView edges={['top']}>` on all screens |
| File system | `expo-file-system/next` | New API — `File`, `Paths` from `expo-file-system/next` |
| Sharing | `expo-sharing` | GPX share-to-app |
| Image picker | `expo-image-picker` | Camera + library for evidence submission |
| Document picker | `expo-document-picker` | GPX file selection |

---

## Project Structure

```
src/
  components/
    AppDrawer.tsx         — Custom animated right-side drawer (Modal + Animated)
    HamburgerButton.tsx   — Hamburger icon, uses DrawerContext to open drawer
    LeaderboardModal.tsx  — Full leaderboard (ride index + per-ride rankings) as a Modal
  context/
    DrawerContext.tsx      — DrawerContext + useDrawer() hook + DrawerProvider
  screens/
    LoginScreen.tsx
    RegisterScreen.tsx
    ForgotPasswordScreen.tsx
    RideListScreen.tsx
    RideDetailScreen.tsx
    SubmitVerificationScreen.tsx
    MyProgressScreen.tsx
    ActivityScreen.tsx
    OnboardingScreen.tsx   — GPS Traccar setup (4 steps)
    ProfileScreen.tsx
    EditProfileScreen.tsx
  services/
    api.ts                 — axios instance, base URL, token injection
    auth.ts                — login, register, logout, forgot-password
    rides.ts               — rides, waypoints, join/leave, GPX download
    progress.ts            — ride progress (hits + pending)
    leaderboard.ts         — leaderboard rides index + per-ride rankings
    profile.ts             — get/update profile, change password
  types/
    navigation.ts          — all stack + tab param list types
App.tsx                    — root navigator (Auth stack / Main tabs)
babel.config.js            — required for expo bundler (presets: babel-preset-expo)
```

---

## Navigation Architecture

```
Root Stack (AppStack)
├── Auth Stack (when no token)
│   ├── Login
│   ├── Register
│   └── ForgotPassword
└── Main Tabs (when token present)  ← wrapped in <AppDrawer>
    ├── Rides Tab (Stack)
    │   ├── RideList
    │   ├── RideDetail
    │   ├── SubmitVerification
    │   ├── MyProgress
    │   └── RideDiagnostics  ← reserved, not yet built
    ├── Activity Tab
    ├── GPS Tab (OnboardingScreen)
    └── Profile Tab (Stack)
        ├── ProfileMain
        └── EditProfile
```

**Hamburger drawer** is a custom `<AppDrawer>` that wraps `<MainTabs>` in `App.tsx`.
It uses `Animated` + `Modal` (pure JS, no native deps). Menu items:
- 🏆 Leaderboard → opens `<LeaderboardModal>`
- ℹ️  About → opens inline `<AboutContent>` Modal

To add a new hamburger item: add an entry to `menuItems` array in `AppDrawer.tsx`
and add a corresponding `useState` + `Modal`.

---

## API Service Layer

**Base URL:** `https://app.mototracker.app/api/v1`

All authenticated requests inject `Authorization: Bearer <token>` via an axios
request interceptor in `src/services/api.ts`. Token is read from AsyncStorage.

### Auth (`src/services/auth.ts`)
| Function | Endpoint | Notes |
|---|---|---|
| `login(email, password)` | `POST /auth/login` | Returns `{ token, user }` |
| `register(data)` | `POST /auth/register` | invite_code optional |
| `logout()` | `POST /auth/logout` | Clears token locally |
| `forgotPassword(email)` | `POST /auth/forgot-password` | Triggers email; reset via web |

### Rides (`src/services/rides.ts`)
| Function | Endpoint | Notes |
|---|---|---|
| `getRides()` | `GET /rides` | Active + public rides only |
| `getRide(id)` | `GET /rides/:id` | Fresh single ride (avoids stale nav params) |
| `joinRide(id)` | `POST /rides/:id/join` | 409 if already joined |
| `leaveRide(id)` | `DELETE /rides/:id/leave` | |
| `getWaypoints(id)` | `GET /rides/:id/waypoints` | Includes `reference_photo_url` |
| `downloadAndShareGpx(id, name)` | `GET /rides/:id/gpx` | Downloads to device, triggers share sheet |

**Ride object fields:**
`id, name, description, type, status, location, featured_image, start_date, end_date,
is_joined, total_waypoints, hit_count, earned_points, max_points, completion_pct, my_maps_url`

**Waypoint object fields:**
`id, name, description, latitude, longitude, radius_meters, group_id, group_name, reference_photo_url`

### Progress (`src/services/progress.ts`)
| Function | Endpoint |
|---|---|
| `getRideProgress(id)` | `GET /rides/:id/progress` |

Returns `{ hits: WaypointHit[], pending: PendingVerification[] }`

`WaypointHit` fields: `waypoint_id, waypoint_name, hit_at, method`
(`method` = `photo | gpx | gps | traccar | null`)

### Leaderboard (`src/services/leaderboard.ts`)
| Function | Endpoint |
|---|---|
| `getLeaderboardRides()` | `GET /leaderboard` |
| `getRideRankings(id)` | `GET /leaderboard/:id` |

Rankings include `is_me: boolean` (flagged by backend against auth user).

### Profile (`src/services/profile.ts`)
| Function | Endpoint |
|---|---|
| `getProfile()` | `GET /profile` |
| `updateProfile(data)` | `PUT /profile` |
| `changePassword(data)` | `PUT /profile/password` |

---

## Key Design Patterns

### Always fetch fresh on screen mount
`RideDetailScreen` and `MyProgressScreen` both call the API on mount rather
than relying on `route.params`. Navigation params go stale when backend state
changes (e.g. a waypoint gets credited between navigation events).

```ts
// Pattern used in RideDetailScreen
useEffect(() => {
  Promise.all([getRide(id), getWaypoints(id)])
    .then(([freshRide, wps]) => { setRide(freshRide); setWaypoints(wps); })
    .catch(...);
}, [id]);
```

### Confirmed hits — grouping by waypoint
`progress.hits` returns one row per hit record, and a waypoint can have multiple
hits from different methods (photo + gps). In `MyProgressScreen`, hits are grouped
by `waypoint_id` before rendering so each waypoint appears once. The `methods`
array on the grouped hit drives the method stripe + badge display.

```ts
const hitsByWaypoint = hits.reduce((acc, h) => {
  if (!acc[h.waypoint_id]) acc[h.waypoint_id] = { ..., methods: [] };
  if (h.method && !acc[h.waypoint_id].methods.includes(h.method))
    acc[h.waypoint_id].methods.push(h.method);
  return acc;
}, {});
```

### Method-aware hit display (MyProgressScreen)
`METHOD_STYLE` map drives the left stripe color and pill badge per method:
- `photo` → blue stripe, PHOTO badge
- `gpx` → purple stripe, GPX badge
- `gps` → cyan stripe, GPS badge
- `combined` (2+ methods) → amber stripe, COMBINED badge
- `default` → green stripe, VERIFIED badge

### Leaderboard as self-contained Modal
`LeaderboardModal` manages its own two-level state (ride index → per-ride rankings)
internally. No navigation stack needed. Back button on rankings returns to index;
close button dismisses the modal entirely. Same pattern as the About modal.

---

## UI Style Reference

All screens use a consistent dark theme:

| Token | Value | Usage |
|---|---|---|
| Background | `#0f1117` | Screen background |
| Card | `#1a2030` | Cards, list containers |
| Border | `#2d3748` | Card borders, dividers |
| Primary text | `#f1f5f9` | Headings, names |
| Secondary text | `#64748b` | Labels, dates |
| Muted text | `#475569` | Empty states, sub-labels |
| Accent blue | `#38bdf8` | Links, active states, progress bars |
| Green (success) | `#86efac` / `#14532d` | Joined badge, confirmed hits |
| Amber (warning) | `#fbbf24` | Pending status |
| Red (error) | `#fca5a5` | Rejected status, errors |

**Type badges:**
- Rally: `bg #1d4ed8`, text `#bfdbfe`
- Explorer: `bg #15803d`, text `#bbf7d0`

---

## Known Gotchas

### Native modules — EAS build required
`@react-navigation/drawer`, `react-native-gesture-handler`, and
`react-native-reanimated` are **NOT in the current dev client build**.
Do not add these without planning a new EAS APK build first.
The custom `AppDrawer` was built specifically to avoid this dependency.

Any package with an `android/` or `ios/` directory, or with `react-native` in
`peerDependencies`, likely requires a new build. Always flag this before suggesting.

**Known native-only packages NOT in current build:**
- `react-native-gesture-handler`
- `react-native-reanimated`
- `@react-navigation/drawer`

### Deploy workflow (Laravel)
The deploy script (`deploy.sh`) SSHs to EC2 and runs `git fetch + reset --hard origin/production`.
**You must `git push origin production` BEFORE running `bash deploy.sh`** — otherwise
the script pulls the old code.

Always develop on `claude-dev`, merge to `production`, push, then deploy:
```bash
git checkout production
git merge claude-dev
git push origin production
bash deploy.sh
```

After deploying to production, **merge back to claude-dev** to keep branches in sync:
```bash
git checkout claude-dev
git merge production
git push origin claude-dev
```

### RideDetailScreen — stale route params
`route.params.ride` is set at navigation time and does not update. Always call
`getRide(id)` on mount to get fresh data. The `route.params.ride` is only used
as the initial state placeholder while the fetch is in-flight.

### `expo-file-system/next` API
GPX download uses the newer `expo-file-system/next` API (not the legacy default export):
```ts
import { File, Paths } from 'expo-file-system/next';
const dest = new File(Paths.document, `ride-${rideId}.gpx`);
const downloaded = await File.downloadFileAsync(url, dest, { headers: { ... } });
```

### `babel.config.js` required
The project requires `babel.config.js` at the root with `presets: ['babel-preset-expo']`.
This was created manually — it is not auto-generated by Expo for this project setup.

---

## Dev Workflow

```bash
# Start dev server
npx expo start --dev-client

# The dev client APK is installed on the Android test device.
# Scan QR code or use tunnel mode if not on same network.

# Laravel local dev (not usually needed — app hits production API)
cd ~/mototracker-laravel
php artisan serve

# Deploy Laravel changes
cd ~/mototracker-laravel
git add -p                        # stage changes
git commit -m "message"
git checkout production
git merge claude-dev
git push origin production
bash deploy.sh
git checkout claude-dev
git merge production              # keep in sync
git push origin claude-dev
```

**Test account:** `contact@nextgenrider.com` (user ID 1, has credited waypoints on Ride 1)

---

## What's Complete (Stage 1)

| Feature | Screen(s) | Notes |
|---|---|---|
| Auth | Login, Register, Forgot Password | Full flow |
| Ride browsing | RideList | Filter tabs (All/Joined/Active), defaults to Joined |
| Ride detail | RideDetail | Map, waypoints, join/leave, GPX, Google Maps link, reference photos |
| Evidence submission | SubmitVerification | Photo (camera/library) + GPX upload |
| Progress tracking | MyProgress | Confirmed hits (method icons), pending, remaining waypoints |
| GPS setup | OnboardingScreen | 4-step Traccar flow |
| Profile | Profile, EditProfile | View + edit name/bike/club, change password |
| Activity feed | ActivityScreen | All submissions across all rides |
| Leaderboard | LeaderboardModal (hamburger) | Ride index + per-ride rankings, "you" highlight |
| Hamburger menu | AppDrawer | Leaderboard + About |

## What's Not In Stage 1

- Push notifications
- iOS build
- Live GPS tracking / background location
- Ride-scoped diagnostics screen (web view exists at `/rider/rides/:id/diagnostics`)
- Coordinator or admin mobile functions
