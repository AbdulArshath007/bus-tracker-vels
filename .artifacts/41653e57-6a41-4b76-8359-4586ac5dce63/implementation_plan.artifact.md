# Implementation Plan - Driver App (Android)

Create a rock-solid Android application for bus drivers to stream GPS location, manage ride lifecycles, and communicate via chat.

## User Review Required

> [!IMPORTANT]
> The app will use a **Foreground Service** for persistent GPS tracking. The driver will need to grant "Always" location permission and battery optimization exemption for reliability.

> [!NOTE]
> The design follows a strict minimalist style: no emojis, no gradients, and specific brand colors (#0096FF for light mode, #0000D1 for dark mode).

## Proposed Changes

### [Component] Project Infrastructure

#### [NEW] [settings.gradle.kts](file:///E:/Bus%20Tracker%20VELS/driver-app/settings.gradle.kts)
#### [NEW] [build.gradle.kts](file:///E:/Bus%20Tracker%20VELS/driver-app/build.gradle.kts) (Project Level)
#### [NEW] [app/build.gradle.kts](file:///E:/Bus%20Tracker%20VELS/driver-app/app/build.gradle.kts) (App Level)
#### [NEW] [AndroidManifest.xml](file:///E:/Bus%20Tracker%20VELS/driver-app/app/src/main/AndroidManifest.xml)

### [Component] UI & Design System

#### [NEW] [Theme.kt](file:///E:/Bus%20Tracker%20VELS/driver-app/app/src/main/kotlin/com/vels/bustracker/driver/ui/theme/Theme.kt)
Implement the Material 3 theme with the specified header colors and flat design principles.

#### [NEW] [SwipeButton.kt](file:///E:/Bus%20Tracker%20VELS/driver-app/app/src/main/kotlin/com/vels/bustracker/driver/ui/components/SwipeButton.kt)
A custom large, thumb-reachable swipe component for starting/ending rides.

### [Component] Authentication

#### [NEW] [LoginScreen.kt](file:///E:/Bus%20Tracker%20VELS/driver-app/app/src/main/kotlin/com/vels/bustracker/driver/ui/auth/LoginScreen.kt)
Login screen with email/password fields. Integrates with the backend's `/auth/login` endpoint.

### [Component] GPS & Ride Tracking

#### [NEW] [TrackingService.kt](file:///E:/Bus%20Tracker%20VELS/driver-app/app/src/main/kotlin/com/vels/bustracker/driver/service/TrackingService.kt)
A Foreground Service that collects GPS data and streams it to the backend via Socket.io. Handles local queuing during network drops.

#### [NEW] [GpsManager.kt](file:///E:/Bus%20Tracker%20VELS/driver-app/app/src/main/kotlin/com/vels/bustracker/driver/data/GpsManager.kt)
Encapsulates location retrieval and Socket.io communication.

#### [NEW] [HomeScreen.kt](file:///E:/Bus%20Tracker%20VELS/driver-app/app/src/main/kotlin/com/vels/bustracker/driver/ui/home/HomeScreen.kt)
Primary dashboard showing ride status, connection status, and the swipe-to-start/end control.

### [Component] Chat

#### [NEW] [ChatScreen.kt](file:///E:/Bus%20Tracker%20VELS/driver-app/app/src/main/kotlin/com/vels/bustracker/driver/ui/chat/ChatScreen.kt)
Chat interface for communicating with students and the admin. Supports text and file attachments.

### [Component] Localization

#### [MODIFY] [strings.xml](file:///E:/Bus%20Tracker%20VELS/driver-app/app/src/main/res/values/strings.xml) (English)
#### [NEW] [strings.xml](file:///E:/Bus%20Tracker%20VELS/driver-app/app/src/main/res/values-ta/strings.xml) (Tamil)

## Verification Plan

### Automated Tests
- Unit tests for GPS queuing logic and state machine transitions (Start -> Active -> Destination Reached -> End).
- Mock Socket.io server to verify location pings are sent correctly.

### Manual Verification
- Deploy to an Android device.
- Perform a simulated ride: swipe to start, move around to verify tracking, and swipe to end.
- Verify background tracking by locking the screen/moving to another app.
- Check Tamil localization toggle.
