# MotoTracker Mobile — Publishing Checklist

## 1. Code & Feature Completion
- [ ] Remove debug `console.log` statements from `notifications.ts` (added Stage 2 Session 2)
- [ ] Fix `cli.appVersionSource` warning in `eas.json` (EAS will require it soon)
- [ ] Confirm push notifications working end-to-end (in progress)
- [ ] Confirm avatar upload working in `EditProfileScreen`
- [ ] Review all `TODO` / `FIXME` comments in codebase
- [ ] Confirm all API error states show user-friendly messages (no raw JSON or crashes on network failure)
- [ ] Test app behaviour with no internet connection — graceful degradation

## 2. App Configuration (`app.json`)
- [ ] Set correct `version` (currently `1.0.0` — confirm this is intentional for first release)
- [ ] Set `versionCode` (Android integer, e.g. `1`) under `android`
- [ ] Set `buildNumber` (iOS string, e.g. `1`) under `ios`
- [ ] Add `android.versionCode` to `eas.json` or configure `appVersionSource: remote`
- [ ] Confirm `bundleIdentifier` / `package` (`app.mototracker.rider`) is the intended final ID — **cannot change after publishing**
- [ ] Add `privacyPolicyUrl` to `app.json`
- [ ] Review splash screen — correct on all screen sizes?
- [ ] Review app icon on dark/light backgrounds

## 3. Firebase / FCM
- [ ] Confirm `google-services.json` API key is restricted to `app.mototracker.rider` package in Firebase console
- [ ] Confirm FCM project is set to production mode (not test/debug)
- [ ] Register SHA-1 and SHA-256 fingerprints of EAS production keystore in Firebase console (required for production builds)

## 4. EAS Build Configuration
- [ ] Set `appVersionSource: remote` in `eas.json` `cli` section
- [ ] Add `production` environment variables to EAS dashboard (API base URL, Mapbox token, etc.)
- [ ] Confirm `MAPBOX_TOKEN` is set correctly for production environment in EAS
- [ ] Confirm `MAPBOX_DOWNLOAD_TOKEN` is not exposed in production build
- [ ] Add `production` profile `submit` config for Google Play auto-submit (optional)

## 5. Google Play Store Setup
- [ ] Create Google Play Developer account (if not already done — one-time $25 fee)
- [ ] Create app listing in Google Play Console (`app.mototracker.rider`)
- [ ] Complete store listing:
  - [ ] App name: "MotoTracker"
  - [ ] Short description (80 chars)
  - [ ] Full description (4000 chars)
  - [ ] App category (Sports / Navigation)
  - [ ] Contact email
  - [ ] Privacy policy URL (must be a live public URL)
- [ ] Upload store assets:
  - [ ] Feature graphic (1024×500px)
  - [ ] App icon (512×512px PNG)
  - [ ] Minimum 2 phone screenshots (recommended 8, portrait)
  - [ ] Optional: 10-inch tablet screenshots
- [ ] Complete content rating questionnaire (IARC)
- [ ] Complete data safety form — declare:
  - [ ] Location data (GPS tracking)
  - [ ] Photos/media (evidence submission)
  - [ ] Personal info (name, email, profile)
  - [ ] Push notification token
- [ ] Set target audience (18+, motorcycle riders)
- [ ] Set up internal/closed testing track before going live

## 6. Privacy & Legal
- [ ] Write and publish a Privacy Policy (required by Google Play) covering:
  - [ ] GPS/location data collection and use
  - [ ] Photo uploads
  - [ ] Push notification tokens
  - [ ] Account data (email, name)
  - [ ] Third-party services: Expo, Firebase, Mapbox, Traccar
- [ ] Write and publish Terms of Service
- [ ] Confirm both are hosted at a permanent public URL
- [ ] Add links to Privacy Policy and Terms in the app (Profile screen or About section)
- [ ] Review Mapbox SDK terms of service for distribution compliance
- [ ] Review Expo terms for push notification use

## 7. Security
- [ ] Confirm `google-services.json` API key restrictions set in Firebase console (restrict to `app.mototracker.rider` package only)
- [ ] Confirm Mapbox token is scoped (read-only, restricted to app bundle ID)
- [ ] Confirm production API (`app.mototracker.app`) is HTTPS only
- [ ] Confirm no hardcoded secrets remain in source code
- [ ] Review `AsyncStorage` usage — auth token stored in plain text (acceptable for this use case, but document the decision)

## 8. Testing
- [ ] Full end-to-end test on real Android device (not emulator)
- [ ] Test on minimum supported Android version (SDK 54 → Android 6.0 minimum)
- [ ] Test all evidence submission flows (photo, GPX, GPS)
- [ ] Test push notification receipt — foreground, background, and cold start (app killed)
- [ ] Test deep-link navigation from notification tap
- [ ] Test on a slow/3G connection
- [ ] Test login, register, forgot password flows
- [ ] Test joining and leaving a ride
- [ ] Test leaderboard with real data
- [ ] Test GPS onboarding flow (Traccar setup)

## 9. Performance
- [ ] Check bundle size — run `npx expo export` and review output
- [ ] Confirm map tiles load acceptably on mobile data
- [ ] Check for excessive re-renders (React DevTools / Flipper)
- [ ] Confirm large GPX files upload without timeout

## 10. Production Build & Submission
- [ ] Run production EAS build: `eas build --profile production --platform android`
- [ ] Download and install production AAB — smoke test on real device
- [ ] Submit to Google Play internal testing track first
- [ ] Test internal build on 2–3 real devices
- [ ] Promote to closed testing (beta) with invited testers
- [ ] Address any feedback
- [ ] Submit for production review
- [ ] Monitor Play Console for policy violations or review feedback

## 11. Post-Launch
- [ ] Set up crash reporting (Sentry or Expo's built-in error reporting)
- [ ] Monitor push notification delivery rates in Expo dashboard
- [ ] Set up EAS Update (`expo-updates`) for OTA JS-only patches between builds
- [ ] Plan version 1.1 — iOS build
