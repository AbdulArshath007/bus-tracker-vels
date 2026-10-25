# VELS University Bus Tracker – Student App

A cross-platform Flutter application tailored for students of **VELS Institute of Science, Technology & Advanced Studies (VISTAS)** to monitor their assigned university bus in real-time, view route schedules, check live ETA, and communicate via the route group chat.

---

## 📱 Features

1. **Live GPS Bus Tracking & ETA**
   - Sub-second live location streaming of the bus using Socket.IO.
   - Interactive OpenStreetMap with route polyline, live bus marker, heading angle, and speed.
   - Live ETA calculation and distance remaining to the student's boarding stop.
   - Visual and audio proximity alerts when the bus is approaching (within 10 minutes / 1 km).

2. **Route Schedule & Bilingual Stops Timeline**
   - Visual vertical timeline of all stops from Tambaram to VELS Pallavaram Campus.
   - Bilingual stop names in both **English and Tamil (தமிழ்)**.
   - Clear indication of passed stops, next upcoming stop, and the student's designated boarding point.
   - One-tap approaching alarm toggle.

3. **Campus Route Switcher**
   - Seamlessly switch tracking between different university bus routes (Route 14, Route 08, Route 22, Route 03).
   - Driver contact info with one-tap direct phone call support.

4. **Route Group Chat**
   - Real-time route chat channel connecting students and bus drivers.
   - Role badges identifying Drivers, Students, and University Staff.
   - Instant message synchronization with admin moderation support.

5. **Profile & Preferences**
   - Student ID, Department, and assigned boarding stop management.
   - Dynamic Light / Dark mode toggle with persistent storage.
   - Language selector (English / Tamil).
   - Direct emergency hotline contacts (VISTAS Transport Office & Campus Security).

---

## 🎨 UI Architecture & Aesthetics
Designed in complete harmony with the **VELS Driver Application**:
- **Signature VELS Palette:** `#2170B5` primary blue in Light Mode, `#3B82F6` in Dark Mode.
- **Modern Typography:** Clean Google Fonts Inter text hierarchy.
- **State Management:** Riverpod 2.5 with `StateNotifier` and auto-reconnecting socket streams.
- **Offline / Demo Mode:** Built-in simulated telemetry so the entire application and interactive map can be tested even without an active backend server running.

---

## 🚀 Running the Student App

### Prerequisites
- Flutter SDK (v3.27+)
- Android Studio / VS Code with Flutter extension

### Commands
```bash
# Install dependencies
flutter pub get

# Run on connected device or emulator
flutter run

# Build release APK
flutter build apk --release

# Build with custom backend URLs:
flutter build apk --dart-define=BASE_URL=https://api.bustrack.vels.edu.in/v1/ --dart-define=SOCKET_URL=https://api.bustrack.vels.edu.in
```
