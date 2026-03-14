# Expo Dev Build — Android Emulator Cheatsheet

## Prerequisites
- Android Studio emulator running
- `adb` accessible (from WSL or Windows terminal)
- Dev build `.apk` downloaded from EAS

---

## 1. Install the APK

**From WSL (if adb is on PATH):**
```bash
adb install "/mnt/c/Users/Rob/Desktop/MotoTracker Mobile/dev-builds/your-build.apk"
```

**From Windows PowerShell / CMD:**
```powershell
adb install "C:\Users\Rob\Desktop\MotoTracker Mobile\dev-builds\your-build.apk"
```

> Only needed when installing a **new** dev build. Skip this step if the app is already installed.

---

## 2. Start the Metro Dev Server

```bash
cd /home/ob/mototracker-mobile
npx expo start --dev-client --host lan
```

Use `--host lan` so the Windows emulator can reach the WSL Metro server via LAN IP.

---

## 3. Connect the App

- Press **`a`** in the Metro terminal to launch on the Android emulator, **or**
- Open the MotoTracker app manually on the emulator — it will auto-connect to Metro.

If it fails to connect, tap the URL bar in the dev client and enter the `exp://` URL shown in the terminal.

---

## Requesting a New Dev Build (EAS)

```bash
cd /home/ob/mototracker-mobile
eas build --profile development --platform android
```

Download the resulting `.apk` from the EAS dashboard and go back to step 1.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `adb: command not found` in WSL | Run the `adb install` from Windows PowerShell instead |
| App can't connect to Metro | Make sure you used `--host lan`; check firewall isn't blocking port 8081 |
| Metro shows wrong IP | Try `--host tunnel` (requires `@expo/ngrok` — already in devDeps) |
| Stale bundle | Press **`r`** in Metro to force reload |
