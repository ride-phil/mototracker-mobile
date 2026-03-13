# MotoTracker Mobile — Stage 2 Plan (Preliminary)

**Status:** Planning
**Prerequisite:** Stage 1 complete and shipped (see `STAGE1_CODING_NOTES.md`)
**Platform:** Android-first, iOS to follow

---

## Quick Context for New Sessions

If you're picking this up fresh, read these first:

| File | What it covers |
|---|---|
| `STAGE1_CODING_NOTES.md` | Architecture, file inventory, API contracts, gotchas, dev workflow |
| `STAGE1_RIDER_PLAN.md` | Original Stage 1 feature scope and decisions |

**Critical gotchas to know before touching anything:**
1. `@react-navigation/drawer`, `react-native-gesture-handler`, `react-native-reanimated` are **NOT** in the current dev client APK — do not introduce them without planning a new EAS build
2. Laravel deploy: always `git push origin production` **before** `bash deploy.sh` — the deploy script pulls from remote
3. Always develop on `claude-dev`, merge to `production`, push, deploy, then merge back to `claude-dev`
4. Test account: `contact@nextgenrider.com` (user 1, has credited waypoints on Ride 1)
5. API base URL: `https://app.mototracker.app/api/v1`

---

## What Already Exists on the Backend

The Laravel backend (`mototracker-laravel`) is rich. Stage 2 is mostly building
mobile UI and thin API wrappers around logic that already exists.

### Backend features with NO mobile UI yet

| Feature | Backend Status | Notes |
|---|---|---|
| Ride diagnostics | ✅ Full service + web view | `/rider/rides/:id/diagnostics` — see `WaypointDiagnosticsService` |
| Waypoint credits inbox | ✅ Full web view | `/rider/waypoint-credits` — canonical hit list |
| GPS hits queue | ✅ Full web view | `/rider/waypoint-hits` — Traccar-specific hits |
| Public user profiles | ✅ Web view | `/r/:username` — bio, stats, social links |
| Public user directory | ✅ Web view | `/users` — all public riders |
| Top riders (all-time) | ✅ Service + web view | `LeaderboardService::topRiders()` — already wired to API partially |
| Ride map (interactive) | ✅ Web view | `/rider/rides/:id/map` — Mapbox |
| Avatar upload | ✅ API endpoint | `POST /api/v1/profile/avatar` — already built, not used in mobile yet |
| Ride join codes | ✅ Model + logic | `join_code_hash` on Ride — private rides via code |
| Emergency contacts | ✅ User model fields | `emergency_contact_name`, `emergency_contact_number` |
| Social links on profile | ✅ User model fields | facebook_url, instagram_url, tiktok_url, website_url |
| Evidence viewing | ✅ Web view | GPX track display, photo viewer — `/rider/evidence/gpx/:id` |
| Ride diagnostics | ✅ `WaypointDiagnosticsService` | Per-waypoint credit breakdown (Hit / Near Miss / Not Hit / method satisfaction) |

---

## Proposed Stage 2 Features

### Priority 1 — Core Rider Experience Completions

#### 1.1 Push Notifications
**What:** Notify riders when verification is accepted/rejected, waypoint credited,
new ride launched.

**Backend work:**
- Install and configure `expo-server-sdk` (or Firebase Admin SDK) on Laravel
- Add `push_token` field to users table (or a separate `push_tokens` table)
- New API endpoint: `POST /api/v1/push-token` — registers device token
- Add listeners/observers to `RideVerification` status changes and `RideWaypointHit` creation
- Queue-based notification dispatch (already has queue infrastructure)

**Mobile work:**
- `expo-notifications` — requires new EAS dev client build (native module)
- Register for push token on app launch, send to backend
- Handle foreground + background notification tap → navigate to relevant screen

**Build required:** ✅ YES — `expo-notifications` is a native module

**Notification types to implement:**
| Trigger | Message |
|---|---|
| Verification accepted | "✅ Waypoint [name] credited on [ride]!" |
| Verification rejected | "❌ Evidence rejected for [waypoint] — [reason]" |
| Waypoint hit (GPS) | "📡 GPS hit recorded at [waypoint]!" |
| New ride launched | "🏍 New ride available: [name]" |

---

#### 1.2 Ride Diagnostics Screen
**What:** Mobile version of `/rider/rides/:id/diagnostics` — lets riders see
exactly why each waypoint was or wasn't credited.

**Backend work:**
- New API endpoint: `GET /api/v1/rides/:id/diagnostics`
- Thin wrapper around existing `WaypointDiagnosticsService::build()`
- Return: `waypoint_id`, `name`, `reference_photo_url`, `radius_m`, `credited`, `hit_at`,
  `hit_distance`, `near_miss`, `method`, `rule_methods`, `rule_required`, `satisfied_methods`

**Mobile work:**
- New `RideDiagnosticsScreen` in the Rides stack
- Accessible from `RideDetailScreen` (button alongside "My Progress")
- Per-waypoint card: status pill (Credited / Near Miss / Not Hit), method badges,
  distance info, reference photo thumbnail

**Build required:** ❌ No

**Navigation:** `RideDetail` → `RideDiagnostics` (already reserved in nav type `RidesStackParamList`)

---

#### 1.3 Top Riders (All-Time) Leaderboard Tab
**What:** Add a second tab/view inside the existing Leaderboard modal — global
all-time top riders ranked by total points.

**Backend work:**
- New API endpoint: `GET /api/v1/leaderboard/top-riders`
- Wrapper around existing `LeaderboardService::topRiders()`
- Returns: `user_id`, `name`, `avatar_url`, `riding_club`, `total_points`,
  `total_waypoints`, `rides_joined`, `rides_completed`, `gps_hits`, `gpx_hits`,
  `photo_hits`, `last_active`

**Mobile work:**
- Add a tab bar inside `LeaderboardModal` — "By Ride" | "All-Time"
- All-time view: ranked list same style as per-ride rankings

**Build required:** ❌ No

---

#### 1.4 Avatar Upload in Profile
**What:** The backend endpoint `POST /api/v1/profile/avatar` already exists.
Wire it up in EditProfileScreen.

**Mobile work:**
- Add avatar image to ProfileScreen (currently shows initials circle)
- Tap avatar → picker (camera or library) → upload via existing endpoint
- Show upload progress / error feedback

**Build required:** ❌ No — `expo-image-picker` already in Stage 1 build

---

#### 1.5 Private Ride Join (Join Code)
**What:** Riders can join private rides using a join code. Backend model already
has `join_code_hash` and `join_code_hint`. Currently no mobile UI.

**Backend work:**
- New endpoint or extend current join: `POST /api/v1/rides/:id/join` with optional
  `join_code` body param
- Validation logic already exists on the web controller — port to API

**Mobile work:**
- On `RideDetailScreen` for private rides: show a "Join with Code" button
- Modal with code input field + submit
- Show `join_code_hint` if available ("Your code starts with…")
- Show appropriate error if code is wrong

**Build required:** ❌ No

---

### Priority 2 — Engagement & Social

#### 2.1 Public Rider Profiles
**What:** Tappable rider profiles. Tap a rider's name on the leaderboard → see
their public profile (bio, bike, club, stats, social links).

**Backend work:**
- New endpoint: `GET /api/v1/riders/:username` — public profile data
- Mirror logic of web `/r/:username` route
- Return: name, username, avatar_url, bio, location, bike, riding_club, riding_style,
  social links, total_points, rides_joined, rides_completed, waypoints_credited

**Mobile work:**
- New `RiderProfileScreen`
- Accessible from leaderboard rows (tap name)
- Avatar, stats strip, bio, social link buttons

**Build required:** ❌ No

---

#### 2.2 Evidence Viewer
**What:** After submitting a verification, riders can see their submitted evidence
and its review status. Mirrors web `/rider/evidence/photo/:id` and
`/rider/evidence/gpx/:id`.

**Mobile work:**
- Enhance `ActivityScreen` — tap a verification row to see detail
- Photo: show the submitted image + EXIF data + status + rejection reason if any
- GPX: show a map with the GPX track plotted + waypoint hit markers
- "Still pending" state for unreviewed submissions

**Backend work:**
- New endpoint: `GET /api/v1/verifications/:id` — single verification detail
  including evidence URL (photo) or GeoJSON (GPX track)

**Build required:** ❌ No

---

#### 2.3 Waypoint Reference Map
**What:** Full-screen map of all ride waypoints before/during a ride, with
ability to tap a pin and see waypoint details + reference photo.

**What exists:** `RideDetailScreen` already has a Mapbox map with pins.
This feature extends it to full-screen with an info bottom sheet per waypoint.

**Mobile work:**
- Full-screen map mode button on `RideDetailScreen`
- Tap waypoint pin → bottom sheet with: name, description, reference photo,
  group, credited/not credited status indicator
- Hit waypoints show green pins; uncredited show grey

**Build required:** ❌ No — Mapbox already in build

---

### Priority 3 — iOS Build

#### 3.1 First iOS Build
**What:** Build and test the app on iOS. Most of the app should work without
changes; main considerations are:

- Mapbox iOS SDK configuration (`app.json` — iOS bundle ID, entitlements)
- `expo-file-system/next` API compatibility
- Safe area handling (`SafeAreaView` already used consistently — should be fine)
- Push notification setup differs between Android (FCM) and iOS (APNs)
- App Store provisioning profiles

**Build required:** ✅ YES — a new EAS build for iOS

---

### Priority 4 — Live GPS & Advanced Tracking

#### 4.1 Live GPS Status Screen Enhancement
**What:** The current GPS tab shows Traccar onboarding. Stage 2 adds a live
"currently tracking" view showing the rider's last known position and active ride status.

**Backend work:**
- New endpoint: `GET /api/v1/gps/status` — last event timestamp, current position
  (if available), active ride context, signal strength indicator
- Reads from `gps_geofence_events` and `traccar_devices`

**Mobile work:**
- Replace the "you're all set" onboarding completion state with a live status card:
  - Last signal received (time ago)
  - Active ride context (if in a ride)
  - Waypoints hit this session
- Small Mapbox map showing last known position

**Build required:** ❌ No — Mapbox already in build

---

#### 4.2 Background GPS / Foreground Tracking (Advanced)
**What:** Active tracking indicator while riding — the app shows the rider
they're being tracked and how many waypoints have been auto-hit.

**Note:** This is the most technically complex Stage 2 item. Traccar client handles
actual GPS transmission (separate app). This is just the display layer.

**Build required:** ❌ No new native modules needed if display-only

---

### Priority 5 — Polish & Quality of Life

#### 5.1 Offline Caching
Cache ride and waypoint data locally so the app is usable without network
(viewing only — submission still requires connectivity).

**Mobile work:**
- Cache `getRides()` and `getWaypoints()` results to AsyncStorage
- Show cached data with a "last updated X ago" indicator when offline
- `expo-network` to detect connectivity

**Build required:** ❌ No

---

#### 5.2 Deep Linking
Allow links like `mototracker://rides/1` to open directly to a ride. Useful
for share links and push notification taps.

**Mobile work:**
- Configure `scheme` in `app.json`
- Add deep link handling in `App.tsx` via `expo-linking`

**Build required:** ❌ No

---

#### 5.3 Ride Sharing
Share a ride link from `RideDetailScreen` — generates a URL to the public
ride page on the web.

**Mobile work:**
- Add share button to `RideDetailScreen` header
- Uses `expo-sharing` or React Native `Share` API (already available)
- Generates `https://app.mototracker.app/rides/:id` URL

**Build required:** ❌ No

---

## Feature Summary Table

| Feature | Priority | Backend Work | Build Required | Effort |
|---|---|---|---|---|
| Push notifications | 1 | Medium (listeners, token storage) | ✅ Yes | High |
| Ride diagnostics screen | 1 | Small (wrap existing service) | ❌ No | Medium |
| Top riders leaderboard tab | 1 | Small (wrap existing service) | ❌ No | Small |
| Avatar upload | 1 | None (endpoint exists) | ❌ No | Small |
| Private ride join codes | 1 | Small (extend join endpoint) | ❌ No | Small |
| Public rider profiles | 2 | Small (new endpoint) | ❌ No | Medium |
| Evidence viewer | 2 | Small (new endpoint) | ❌ No | Medium |
| Waypoint reference map (full-screen) | 2 | None | ❌ No | Medium |
| iOS build | 3 | None | ✅ Yes | Medium |
| Live GPS status screen | 4 | Small (new endpoint) | ❌ No | Medium |
| Background tracking display | 4 | None | ❌ No | Medium |
| Offline caching | 5 | None | ❌ No | Medium |
| Deep linking | 5 | None | ❌ No | Small |
| Ride sharing | 5 | None | ❌ No | Small |

---

## EAS Build Planning

The current dev client APK was built with:
- Mapbox (`@rnmapbox/maps`)
- `expo-file-system` (next API)
- `expo-image-picker`
- `expo-document-picker`
- `expo-sharing`
- `@react-native-async-storage/async-storage`
- `react-native-safe-area-context`
- `@react-navigation/native-stack` + `@react-navigation/bottom-tabs`

**The next EAS build should include:**
- `expo-notifications` — for push notifications (Priority 1.1)
- iOS target — for Priority 3.1

**Do NOT add without a new build:**
- `react-native-gesture-handler`
- `react-native-reanimated`
- `@react-navigation/drawer`

---

## Backend: APIs Still to Build

| Endpoint | Method | Feature |
|---|---|---|
| `/api/v1/rides/:id/diagnostics` | GET | Ride diagnostics screen |
| `/api/v1/leaderboard/top-riders` | GET | All-time leaderboard tab |
| `/api/v1/riders/:username` | GET | Public rider profiles |
| `/api/v1/verifications/:id` | GET | Evidence viewer |
| `/api/v1/gps/status` | GET | Live GPS status |
| `/api/v1/push-token` | POST | Push notification registration |
| `/api/v1/rides/:id/join` (extend) | POST | Add join_code param for private rides |

---

## Current Mobile App File Reference

```
App.tsx                                   Root navigator
babel.config.js                           Required — presets: babel-preset-expo
src/
  components/
    AppDrawer.tsx                         Hamburger drawer (custom, pure JS)
    HamburgerButton.tsx                   Opens drawer via DrawerContext
    LeaderboardModal.tsx                  Leaderboard (ride index + per-ride)
  context/
    DrawerContext.tsx                     useDrawer() hook
  screens/
    LoginScreen.tsx                       Auth
    RegisterScreen.tsx                    Auth
    ForgotPasswordScreen.tsx              Auth
    RideListScreen.tsx                    Tab 1 root — rides list
    RideDetailScreen.tsx                  Ride detail + map + waypoints
    SubmitVerificationScreen.tsx          Photo/GPX submission
    MyProgressScreen.tsx                  Per-ride progress + remaining waypoints
    ActivityScreen.tsx                    Tab 2 — all verifications
    OnboardingScreen.tsx                  Tab 3 — GPS Traccar setup
    ProfileScreen.tsx                     Tab 4 — view profile
    EditProfileScreen.tsx                 Edit profile + change password
  services/
    api.ts                                axios instance + token injection
    auth.ts                               login/register/logout/forgot-password
    rides.ts                              rides, waypoints, GPX, join/leave
    progress.ts                           ride hits + pending verifications
    leaderboard.ts                        leaderboard rides + rankings
    profile.ts                            get/update profile + password
  types/
    navigation.ts                         All stack + tab param list types
```

---

## Suggested Start Order for Stage 2

1. **Ride diagnostics** — quick win, backend nearly free, high rider value
2. **Avatar upload** — backend already done, just wire up the UI
3. **Top riders leaderboard tab** — small addition to existing modal
4. **Private join codes** — simple modal, small backend change
5. **Evidence viewer** — improves Activity screen significantly
6. **Public rider profiles** — makes leaderboard tappable and social
7. **EAS build with expo-notifications** — foundation for push
8. **Push notifications** — highest value, needs build
9. **iOS build** — after push notifications are stable on Android
