# Vels Bus Tracker — Driver App (Flutter)

A complete rewrite of the Kotlin Driver App in Flutter, fixing **11 security vulnerabilities** found in the original codebase.

---

## Security Fixes Applied

| # | Vulnerability | Original (Kotlin) | Fix (Flutter) |
|---|---|---|---|
| 1 | Tokens in plain SharedPreferences | `SessionManager.kt` | `flutter_secure_storage` (AES-GCM + Android Keystore) |
| 2 | Hardcoded API URL in source | `LoginViewModel.kt`, `HomeViewModel.kt` | `--dart-define=BASE_URL=...` at build time |
| 3 | Silent empty catch blocks | `HomeViewModel.kt` | Typed exceptions surfaced to UI state |
| 4 | Token existence ≠ validity | `SessionManager.kt` | JWT expiry decoded locally; auto-refresh on 401 |
| 5 | Socket doesn't re-auth on reconnect | `GpsManager.kt` | Fresh token sent on every reconnect event |
| 6 | GPS queue flushed as malformed JSON string | `GpsManager.kt` | Proper `List<Map>` → JSON array |
| 7 | `allowBackup="true"` | `AndroidManifest.xml` | `allowBackup="false"` + `fullBackupContent="false"` |
| 8 | `isMinifyEnabled = false` in release | `build.gradle.kts` | `minifyEnabled true` + `shrinkResources true` |
| 9 | No certificate pinning | (missing) | `network_security_config.xml` with SHA-256 pins |
| 10 | No input validation on login | `LoginViewModel.kt` | Email regex + min-length check client-side |
| 11 | Chat sends raw unvalidated text | `ChatViewModel.kt` | Trim + length clamp before emit |

---

## Project Structure

```
lib/
├── main.dart                   ← Entry point, routing (go_router), auth guard
├── app_config.dart             ← Build-time constants (dart-define)
├── core/
│   ├── secure_storage.dart     ← AES-encrypted token storage
│   ├── session_manager.dart    ← JWT expiry validation, user profile
│   ├── api_client.dart         ← Dio + auth interceptor + 401 refresh
│   ├── socket_manager.dart     ← Socket.IO + reconnect re-auth
│   └── gps_manager.dart        ← Location stream + offline queue
├── models/
│   ├── user_profile.dart
│   ├── ride.dart
│   └── chat_message.dart
├── services/
│   ├── auth_service.dart       ← Login (validated), logout
│   └── rides_service.dart      ← Start / active / end ride
├── providers/                  ← Riverpod state
│   ├── session_provider.dart
│   ├── ride_provider.dart
│   └── chat_provider.dart
├── theme/
│   └── app_theme.dart          ← Premium dark theme (Poppins, teal/indigo)
├── widgets/
│   ├── swipe_button.dart       ← Animated swipe-to-confirm
│   ├── connection_badge.dart   ← Pulsing live status badge
│   └── ride_status_card.dart
└── screens/
    ├── login_screen.dart       ← Animated gradient, glassmorphism card
    ├── home_screen.dart        ← Ride dashboard with animated transitions
    └── chat_screen.dart        ← Real-time chat with bubble UI
```

---

## Building

### Prerequisites
- Flutter SDK ≥ 3.32 — [install](https://docs.flutter.dev/get-started/install)
- Android SDK (API 26+)
- Java 17+

### Setup
```bash
# Install dependencies
flutter pub get

# Generate JSON serialization code (already pre-generated, but run after any model change)
flutter pub run build_runner build --delete-conflicting-outputs

# Analyze
flutter analyze
```

### Debug build
```bash
flutter run --dart-define=BASE_URL=https://api.vels-bustracker.com/ \
            --dart-define=SOCKET_URL=https://api.vels-bustracker.com
```

### Release APK
```bash
flutter build apk --release \
  --dart-define=BASE_URL=https://api.vels-bustracker.com/ \
  --dart-define=SOCKET_URL=https://api.vels-bustracker.com
```

### Release App Bundle (Play Store)
```bash
flutter build appbundle --release \
  --dart-define=BASE_URL=https://api.vels-bustracker.com/ \
  --dart-define=SOCKET_URL=https://api.vels-bustracker.com
```

---

## Certificate Pinning

Before production release, replace the placeholder SHA-256 pins in  
`android/app/src/main/res/xml/network_security_config.xml`:

```bash
# Get the real pin from the live server
openssl s_client -connect api.vels-bustracker.com:443 < /dev/null 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary \
  | base64
```

---

## Key Tech Stack

| Concern | Package |
|---|---|
| State | `flutter_riverpod` 2.x |
| Secure storage | `flutter_secure_storage` 9.x |
| HTTP | `dio` 5.x |
| Socket.IO | `socket_io_client` 2.x |
| Location | `geolocator` 12.x |
| Permissions | `permission_handler` 11.x |
| Foreground service | `flutter_foreground_task` 8.x |
| Navigation | `go_router` 14.x |
| Fonts | `google_fonts` (Poppins) |
