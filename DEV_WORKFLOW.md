# MotoTracker Mobile — Dev Workflow Cheatsheet

## Daily Development (No Build Needed)

For pure JS/TS changes — screens, styles, logic, new screens, API calls:

```bash
cd ~/mototracker-mobile
npx expo start --tunnel --dev-client
```

1. Wait for QR code and tunnel URL to appear
2. Open the **dev client APK** on your phone (not Expo Go)
3. Tap **Enter URL manually** → paste the `https://` URL from terminal
4. App loads — every file save hot-reloads instantly on your phone

> The tunnel URL changes every time Metro restarts. Always grab the fresh one.

---

## When You Need a New Build

Only needed when you **add a new native package** (`npm install` / `npx expo install`).

```bash
cd ~/mototracker-mobile

# Dev client (install once, then use for live reload)
eas build --profile development --platform android

# Preview APK (shareable, standalone, no Metro needed)
eas build --profile preview --platform android

# Production AAB (Play Store)
eas build --profile production --platform android
```

- Free tier: **30 builds/month** (resets monthly)
- Queue wait: ~30-60 min on free tier
- Track builds: https://expo.dev/accounts/mototracker/projects/mototracker-mobile/builds

---

## Build Profiles Quick Reference

| Profile | Output | Needs Metro? | Use for |
|---|---|---|---|
| `development` | APK | Yes (dev client) | Day-to-day coding with live reload |
| `preview` | APK | No | Testing features, sharing with riders |
| `production` | AAB | No | Play Store submission |

---

## Deploy Backend Changes

```bash
cd ~/mototracker-laravel
bash deploy.sh
```

Pulls `origin/production` on EC2, runs migrations, restarts queue, builds assets.

---

## Git Branches

| Repo | Branch | Purpose |
|---|---|---|
| mototracker-laravel | `production` | Live server, deploy from here |
| mototracker-laravel | `mobile-dev` | API work before merging to production |
| mototracker-mobile | `main` | Everything, EAS builds from here |

---

## EAS CLI Setup (WSL2)

If `eas` command not found:

```bash
npm install -g eas-cli --prefix ~/.local
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Login:
```bash
eas login
```

---

## EAS Environment Variables

```bash
# List
eas env:list

# Add a new secret
eas env:create --scope project --name KEY_NAME --value "value" --environment preview
eas env:create --scope project --name KEY_NAME --value "value" --environment production
```

Current secrets:
- `MAPBOX_TOKEN` — public `pk.*` token (runtime map display)
- `MAPBOX_DOWNLOAD_TOKEN` — secret `sk.*` token with DOWNLOADS:READ (build-time only)

---

## Dev Client First-Time Setup

1. Build the dev client APK:
   ```bash
   eas build --profile development --platform android
   ```
2. Download and install the APK from the EAS build page
3. Start Metro:
   ```bash
   cd ~/mototracker-mobile
   npx expo start --tunnel --dev-client
   ```
4. Open the dev client app on your phone
5. Enter URL manually → paste the `https://f43...exp.direct` URL from terminal
6. Done — from now on just start Metro and open the app

> Rebuild the dev client APK any time you add a new native package.

---

## Adding a New Native Package

```bash
cd ~/mototracker-mobile
npx expo install package-name   # use this instead of npm install for expo packages
```

Then:
1. Commit and push
2. Run a new `development` build to update the dev client APK
3. Install the new dev client APK on your phone
4. Resume live reload workflow as normal

---

## Useful Commands

```bash
# Check Expo/EAS versions
npx expo --version
eas --version

# Clear Metro cache if things get weird
npx expo start --tunnel --dev-client --clear

# Check build status
eas build:list

# View logs for a specific build
eas build:view
```

---

## API Base URL

```
https://app.mototracker.app/api/v1
```

All requests need: `Authorization: Bearer <token>`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Dev client shows "Java Runtime Exception / make sure Metro is running" | Metro isn't running or URL is stale — start Metro and re-enter the URL |
| Dev client "Fetch development servers" finds nothing | Use Enter URL manually instead |
| Red screen "Cannot find native module 'ExpoXxx'" | New native package added after dev client was built — rebuild dev client APK |
| QR code won't scan | Use Enter URL manually in the dev client app |
| Tunnel URL expired | Restart Metro — grab the new URL from terminal |
| EAS `secret:create` not found | Use `eas env:create` instead |
| `eas` command not found | See EAS CLI Setup section above |
