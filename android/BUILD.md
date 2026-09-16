# Android build

Requirements: **JDK 17+** and **Android SDK** (platforms 35, build-tools 35).

```bash
cp local.properties.example local.properties
# edit sdk.dir
./gradlew assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
# Copy to ../artifacts/app-debug.apk
./gradlew bundleRelease   # AAB for Play Console
```

This repository’s builder VM had **no Java / no Android SDK**, so APK generation was skipped. The Gradle project is complete (AGP 8.7, Kotlin 2.0, Compose, Hilt, Room, IME).
