# MotoTracker Mobile — Stage 1 Rider Plan

**Goal:** A rider can do everything they need entirely within the mobile app —
from account creation through ride participation, evidence submission, and
progress tracking. No admin or coordinator functions.

**Platform:** Android-first. iOS deferred to Stage 2.

---

## Decisions Made

| Topic | Decision |
|---|---|
| Registration | Full in-app registration (Option B) — riders may sign up on-site at events |
| Forgot Password | Full in-app flow — email triggers Laravel reset, link opens web reset page |
| Navigation | Bottom tab bar (standard mobile UX) — replaces hamburger drawer |

---

## Current Status

These screens exist and are functionally complete:

| Screen | Status | Notes |
|---|---|---|
| Login | ✅ Done | Email/password, Sanctum token |
| Ride List | ✅ Done | Featured image, status, location, join button, progress bar |
| Ride Detail | ✅ Done | Map, waypoints, join/leave, GPX download |
| Submit Verification | ✅ Done | Photo (camera + library) and GPX file upload |
| My Progress | ✅ Done | Confirmed hits, pending verifications, completion % |
| GPS Setup (Onboarding) | ✅ Done | 4-step Traccar setup with credential display |
| Profile | ✅ Partial | Read-only — name, email, role, sign out |

---

## What Needs to Be Built

| Item | Mobile Work | Backend Work | EAS Build? |
|---|---|---|---|
| Registration screen | New screen | New API endpoint | No |
| Forgot password screen | New screen | New API endpoint | No |
| Bottom tab navigation | Restructure nav | None | No |
| Profile editing | Edit form on Profile | New API endpoint | No |
| Activity screen | New screen | Expand existing endpoint | No |
| Ride filtering | Filter bar on Ride List | None (client-side) | No |

> **None of these require a new EAS build.** All are JS-only changes.
> The existing dev client APK handles everything.

---

## Backend Work Summary

All existing business logic is already in place. These are thin API wrappers.

| Endpoint | Method | Notes |
|---|---|---|
| `/api/v1/auth/register` | POST | Mirrors web `RegisteredUserController` — invite code logic already written there |
| `/api/v1/auth/forgot-password` | POST | Triggers Laravel's built-in password reset email; link opens web reset page |
| `/api/v1/profile` | PUT | Update display_name, bike, riding_club — fields already on User model |
| `/api/v1/profile/password` | PUT | Change password — current + new + confirm |
| `/api/v1/verifications` | GET | Already exists — expand response to include ride_name and waypoint_name |

---

## Full Page List — Stage 1 Complete

---

### 1. Registration *(new)*
Entry point for first-time riders. Accessible from Login screen.

**Elements:**
- MotoTracker logo / app name header
- Name field
- Email field
- Password field
- Confirm password field
- Invite code field *(shown only when `REGISTRATION_INVITE_REQUIRED=true` on server)*
- Terms acceptance checkbox with link to terms
- Create Account button
- "Already have an account? Sign In" link back to Login
- Inline field validation errors
- Success → auto-login and navigate to Ride List

**Backend:** `POST /api/v1/auth/register`

---

### 2. Login *(exists — minor additions)*

**Elements (current):**
- MotoTracker logo
- Email + password fields
- Sign In button

**Add:**
- "Forgot password?" link → Forgot Password screen
- "New rider? Create account" link → Registration screen

---

### 3. Forgot Password *(new)*
Two-step flow: request reset email, then confirmation.

**Screen A — Request Reset:**
- "Reset Password" heading
- Explanation text: "Enter your email and we'll send a reset link"
- Email field
- Send Reset Link button
- Back to Login link

**Screen B — Confirmation (after submit):**
- Confirmation message: "Check your email for a reset link"
- Note: "The link will open a browser page to complete your reset"
- Back to Login button

**Backend:** `POST /api/v1/auth/forgot-password`
*(triggers Laravel's built-in `PasswordResetLinkController` logic — email sent,
link opens `https://app.mototracker.app/reset-password/...` in browser)*

---

### 4. Ride List *(exists — add filtering)*
Main landing screen after login (first tab).

**Elements (current):**
- Pull-to-refresh
- Ride cards: featured image, name, type badge, status badge, location, dates, progress bar, join button

**Add:**
- Filter bar at top: **All** / **Joined** / **Active** tabs
- Client-side filtering — no backend change needed

---

### 5. Ride Detail *(exists — complete)*

**Elements:**
- Featured image header
- Ride name, type badge, location
- Description
- Date range card (Start / End)
- Progress card: hits / total waypoints / completion % (joined rides only)
- Join button (if not joined)
- Joined badge + Leave Ride button (if joined)
- Error display
- Waypoints section header with GPX download button + waypoint count
- Mapbox map with waypoint pins
- Waypoint list: number, name, description, group, Directions link
- Submit Evidence button (joined + has waypoints)
- My Progress button (joined + has waypoints)

---

### 6. Submit Verification *(exists — complete)*

**Elements:**
- Ride name context header
- Waypoint selector (radio list — pre-selects if only one waypoint)
- Evidence type toggle: Photo / GPX Track
- Photo mode: Take Photo button + Choose from Library button
- GPX mode: Select GPX File button
- File preview: photo thumbnail or GPX filename
- Remove file option
- Error display
- Submit Evidence button (disabled until waypoint + file selected)
- Result screen: Waypoint Hit ✓ or Submitted for Review ⏳ with reason text + Back to Ride button

---

### 7. My Progress *(exists — complete)*
Accessed from Ride Detail. Per-ride progress view.

**Elements:**
- Ride name context
- Summary stats row: Hits / Pending / Completion %
- Points progress bar (X of Y Max)
- Confirmed Hits list: waypoint name + hit timestamp + green checkmark
- Pending Verifications list: type icon + status badge + submission date
- Pull-to-refresh
- Empty state for no hits yet

---

### 8. Activity *(new — second tab)*
Global view of all rider submissions across all rides.

**Elements:**
- "My Activity" header
- List of all verifications, newest first
- Each row: ride name, waypoint name, evidence type icon (📷 / 📍), status badge, date submitted
- Status badges: pending (yellow), accepted (green), rejected (red), needs_review (orange)
- Pull-to-refresh
- Empty state: "No submissions yet. Join a ride to get started."

**Backend:** Expand `GET /api/v1/verifications` response to include `ride_name` and `waypoint_name`

---

### 9. GPS Setup *(exists — complete, third tab)*

**Elements:**
- Step 1 — Create GPS Account: button → shows server URL, email, password with copy buttons
- Step 2 — Generate Device ID: button → shows device UID with copy button
- Step 3 — Install Traccar Client: Play Store link, settings checklist
- Step 4 — Confirm Signal: auto-polls every 10s, shows signal received or waiting spinner
- Ready banner when all steps complete
- Warning banner if GPS tracking disabled by admin

---

### 10. Profile *(exists — add editing, fourth tab)*

**Elements (current):**
- Avatar circle (initials)
- Display name, email, role badge
- Rider info card: bike, riding club
- App info card: version, server
- Sign Out button (with confirmation)

**Add:**
- Edit Profile button → Edit Profile screen

---

### 11. Edit Profile *(new — pushed from Profile tab)*

**Elements:**
- Display name field (pre-filled)
- Bike field (pre-filled)
- Riding Club field (pre-filled)
- Save Changes button
- Divider
- Change Password section:
  - Current password field
  - New password field
  - Confirm new password field
  - Update Password button
- Inline validation errors per field
- Success feedback (brief confirmation message)

**Backend:**
- `PUT /api/v1/profile` — display_name, bike, riding_club
- `PUT /api/v1/profile/password` — current_password, password, password_confirmation

---

## Navigation Structure

### Bottom Tab Bar

| Tab | Icon | Root Screen | Stack Screens |
|---|---|---|---|
| Rides | 🏍 | Ride List | Ride Detail → Submit Verification, My Progress |
| Activity | 📋 | Activity | — |
| GPS | 📡 | GPS Setup | — |
| Profile | 👤 | Profile | Edit Profile |

### Auth Stack (before login)
Login → Registration
Login → Forgot Password

### Implementation Notes
- `@react-navigation/bottom-tabs` is **already installed** in package.json — no new EAS build needed
- Remove the existing `DrawerMenu` component and `AppHeader` hamburger once tabs are in place
- Tab navigator wraps the app after login; auth screens remain outside the tab navigator
- Each tab is its own nested stack navigator so pushing screens (e.g. Ride Detail) works correctly

---

## Development Priority Order

1. **Bottom tab navigation** — structural foundation; do this first so new screens slot in correctly
2. **Registration screen + backend endpoint** — riders need this to get started
3. **Forgot password screen + backend endpoint** — pairs with registration
4. **Profile editing + backend endpoints** — riders need to set up their display name and bike info
5. **Activity screen + backend expand** — completes the "what have I done" story
6. **Ride filtering** — quality of life, client-side only

---

## Out of Scope for Stage 1

- Push notifications (Stage 2)
- iOS build (Stage 2)
- Live GPS tracking screen with background location (Stage 2)
- Leaderboard / rider rankings (Stage 2)
- Coordinator mobile functions (Stage 3 or web-only forever)
- Admin functions (web-only, always)
