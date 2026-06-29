# Android packaging

This project uses Capacitor only as a wrapper around the React + Vite app.

## Requirements

- Node.js and npm
- Android Studio with Android SDK 34 and JDK 17
- Source icon at `public/app-icon.png` as a square PNG, at least 1024x1024

## Web and Android commands

```bash
npm install
npm run dev
npm run build
npm run android:assets
npm run android:sync
npm run android:open
```

Build an installable debug APK:

```bash
npm run android:debug
```

Build a release AAB:

```bash
npm run android:bundle
```

Outputs:

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`

The release AAB must be signed with your production upload key before publishing to Google Play. Android Studio can create and manage this key through **Build > Generate Signed Bundle / APK**.

When replacing the icon, overwrite `public/app-icon.png`, then run:

```bash
npm run android:assets
npx cap sync android
```

The Android app label is `میرزا` and the package id is `com.mirzabook.app`.
