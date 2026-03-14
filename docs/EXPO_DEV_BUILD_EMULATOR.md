# Expo Dev Build — Android Emulator Cheatsheet

## Prerequisites
- Android Studio **Google Play** emulator running (must be Google Play image, not Google APIs)
- `adb` accessible from WSL
- Dev build `.apk` downloaded from EAS

---

## 1. Install the APK

APK files are saved to `C:\Users\Rob\Desktop\MotoTracker-Mobile\dev-builds\`

**From WSL — cd into the folder first (avoids path/space issues):**
```bash
cd "/mnt/c/Users/Rob/Desktop/MotoTracker-Mobile/dev-builds"
adb install your-build.apk
```

If adb can't find the device:
```bash
adb kill-server && adb start-server && adb devices
```

> Only needed when installing a **new** dev build. Skip if app is already installed.

---

## 2. Start the Metro Dev Server

Use `--tunnel` — required for Google Play emulator (can't reach WSL via LAN IP):

```bash
cd /home/ob/mototracker-mobile
npx expo start --dev-client --tunnel
```

The tunnel URL stays active for the whole session. Note the `exp+...` URL shown in the terminal — you'll need it to connect the app.

---

## 3. Connect the App

Open MotoTracker on the emulator → tap **"Enter URL manually"** → enter the tunnel URL from the Metro terminal:

```
exp+mototracker-mobile://expo-development-client/?url=https%3A%2F%2F<tunnel-id>-mototracker-8081.exp.direct
```

> The tunnel URL is the same for the entire Metro session. No need to re-enter unless Metro is restarted.

---

## 4. Reinstall Without Losing Session

If you need to reinstall the APK (e.g. new build), the tunnel stays running:

```bash
adb uninstall app.mototracker.rider
cd "/mnt/c/Users/Rob/Desktop/MotoTracker-Mobile/dev-builds"
adb install new-build.apk
```

Then reopen the app and re-enter the same tunnel URL.

---

## Requesting a New Dev Build (EAS)

```bash
cd /home/ob/mototracker-mobile
eas build --profile development --platform android
```

Download the `.apk` from the EAS dashboard and go back to step 1.

**Important:** Only trigger a build after code review confirms it's ready. Builds take 10–15 minutes on the free tier.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| White Google screen on boot | Emulator still starting — wait 60s. If stuck, wipe data in AVD Manager |
| `adb: no devices` | Run `adb kill-server && adb start-server && adb devices` |
| App can't connect to Metro | Use `--tunnel` not `--host lan` for Google Play emulator |
| `r` reload doesn't work | Close and relaunch the app manually |
| Push token not registering | Must use Google Play emulator (not Google APIs). Sign into Google account on emulator first |
| Notification no popup | Uninstall + reinstall app to reset notification channel cache |
