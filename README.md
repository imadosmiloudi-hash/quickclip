# QUICKCLIP

Personal content library **inside an Android keyboard** for Messenger / customer service: reusable text, voice, video, and images. Local-first (Room). Optional Railway sync (Node + Postgres).

```
quickclip/
  android/     Kotlin + Compose + Hilt + Room IME
  backend/     Express + TypeScript + Drizzle + JWT
  docs/        ANDROID_LIMITATIONS.md, RAILWAY.md
  artifacts/   debug APK if assembled
```

## Architecture

- **Android app** = content library (Compose) + **real IME** (`QuickClipInputMethodService`).
- **Local Room DB** is the source of truth. Keyboard reads it with no network/auth.
- **Media** is copied into `filesDir/media` and shared via `FileProvider`.
- **Text insert:** `InputConnection.commitText`.
- **Media insert:** `commitContent` when the editor supports it; otherwise `ACTION_SEND`.
- **Backend:** JWT register/login, folders, content, multipart media, pull/push sync, per-user isolation.

See [docs/ANDROID_LIMITATIONS.md](docs/ANDROID_LIMITATIONS.md) before expecting Messenger to accept IME media.

## Backend

Requires Node 20+.

```bash
cd backend
npm install
cp .env.example .env
npm test          # PGlite, no Postgres required
npm run build
npm run dev       # http://localhost:3000/health
```

Production: Postgres via `DATABASE_URL`. Deploy: [docs/RAILWAY.md](docs/RAILWAY.md).

Scripts: `build`, `start`, `dev`, `migrate`, `test`.

## Android

**applicationId:** `com.quickclip.app`  
**minSdk 26 / compileSdk 35 / Kotlin 2.0 / AGP 8.7**

### If Android SDK + JDK 17 are installed

```bash
cd android
# create local.properties:
# sdk.dir=/path/to/Android/Sdk
./gradlew assembleDebug
# APK:
# app/build/outputs/apk/debug/app-debug.apk
# copy to ../artifacts/
```

Release / Play AAB:

```bash
./gradlew bundleRelease
# app/build/outputs/bundle/release/app-release.aab
```

Release signing: add `signingConfigs` in `app/build.gradle.kts` with your keystore (do not commit secrets).

### If SDK is missing (this builder VM)

Install [Android Studio](https://developer.android.com/studio) (or command-line SDK + JDK 17), open `android/`, let Gradle sync, then `assembleDebug`. Copy the APK to `artifacts/`.

### Install keyboard on a phone

1. Install the debug APK (`adb install -r artifacts/app-debug.apk` or file manager).
2. Open QUICKCLIP → finish onboarding (Welcome → Permissions → Enable IME → test field → Ready).
3. **Enable IME:** system Settings → System → Languages & input → On-screen keyboard → manage keyboards → enable **QUICKCLIP Keyboard**.
4. In any text field, tap the keyboard icon in the nav bar and select QUICKCLIP.
5. Use **QuickClip** panel (search / type tabs / favorites) or switch to **Keyboard** (simple QWERTY).
6. Tap a text snippet to insert. Tap media to `commitContent` or share.

### Messenger

Text works. Media often requires the share fallback — that is an Android/host-app limit, not a missing feature. Details: [docs/ANDROID_LIMITATIONS.md](docs/ANDROID_LIMITATIONS.md).

### Demo data

First launch seeds folders (Welcome, Orders, Follow Up, Payment, Products, Customer Support, Voice Messages, Videos, Images) and demo snippets marked **Demo**. Import real media via 📎 (SAF).

## Privacy

Keyboard does **not** log keystrokes or read chats. Optional sync sends **your saved library** after login. Automation / Accessibility is **OFF** and unimplemented beyond a disabled stub.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Keyboard not listed | App installed? Onboarding opened IME settings? Reboot after first install on some OEMs. |
| Can’t insert media | Host app rejected `commitContent`. Use share sheet. Import a real file (demo media has no bytes). |
| Sync 401 | Register/login in Settings → Account. Check `APP_BASE_URL`. |
| `npm test` slow | PGlite WASM cold start; still no Docker needed. |
| Gradle wrapper | Needs JDK 17+ and `android/gradle/wrapper/gradle-wrapper.jar` (checked in). |
| Railway health fail | `GET /health`, `PORT` bound to `0.0.0.0` via Express listen. Postgres `DATABASE_URL` in prod. |

## License

Private — https://github.com/imadosmiloudi-hash/quickclip
