# Dashboard — Android app

A tiny Android app that opens the homelab dashboard full-screen in a WebView, so it
looks and feels like a real app on your phone. That's all it does: it loads one URL,
keeps the dark background, remembers the page settings (localStorage), and shows a
friendly screen if the phone is off the home network.

The app is **optional** — the dashboard already works in any phone browser. This just
gives it a home-screen icon and a cleaner full-screen view.

## Change one line, then build

1. Open the folder in **Android Studio** (File → Open). Let it sync Gradle; it will
   recreate the Gradle wrapper on its own.
2. Set **your** dashboard address in two places:
   - `app/src/main/java/app/homelab/dashboard/MainActivity.kt` — the line
     `private val dashboardUrl = "http://192.168.1.30:8085/"`
   - `app/src/main/res/xml/network_security_config.xml` — the `<domain>` line
     (plain http is allowed only for the local addresses listed there)
3. Build the app: **Build → Build Bundle(s) / APK(s) → Build APK(s)**. Android Studio
   shows a link to the finished `.apk`.
4. Copy that `.apk` to the phone and open it to install (you may need to allow
   "install unknown apps" for your file manager once).

## Good to know

- The visible app name is **Dashboard** (`app/src/main/res/values/strings.xml`).
- Package id: `app.homelab.dashboard`. If you change it, the phone treats it as a new
  app (the old one stays until you uninstall it).
- The error screen text is in English in `MainActivity.kt` — change those three lines
  if you want another language.
- After updating the dashboard pages on the server, clear the app's cache on the phone
  (Settings → Apps → Dashboard → Storage → Clear cache) so it reloads the new version.
- Requires Android 8 (API 26) or newer.

---
Built by **Playback71** for the MY HOMELAB project, with the help of Claude (Anthropic).
November 2026.
