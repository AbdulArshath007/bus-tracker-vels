import 'dart:isolate';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_driver/core/gps_manager.dart';
import 'package:vels_driver/core/session_manager.dart';
import 'package:vels_driver/core/socket_manager.dart';
import 'package:vels_driver/models/ride.dart';
import 'package:vels_driver/providers/session_provider.dart';
import 'package:vels_driver/services/rides_service.dart';

// ─── Service provider ─────────────────────────────────────────────────────

final ridesServiceProvider = Provider<RidesService>((ref) => RidesService());

// ─── Ride State ────────────────────────────────────────────────────────────

sealed class RideState {
  const RideState();
}

class RideIdle extends RideState {
  const RideIdle();
}

class RideLoading extends RideState {
  const RideLoading();
}

class RideActive extends RideState {
  const RideActive(this.ride);
  final Ride ride;
}

class RideDestinationReached extends RideState {
  const RideDestinationReached(this.ride);
  final Ride ride;
}

class RideError extends RideState {
  const RideError(this.message);
  final String message;
}

// ─── Ride Notifier ─────────────────────────────────────────────────────────

class RideNotifier extends StateNotifier<RideState> {
  RideNotifier(this._rides, this._session) : super(const RideIdle()) {
    _checkActiveRide();
  }

  final RidesService _rides;
  final SessionManager _session;

  // ── Check for an existing active ride on startup ─────────────
  Future<void> _checkActiveRide() async {
    final user = await _session.getUser();
    final busId = user?.busId;
    if (busId == null) return;

    try {
      final ride = await _rides.getActiveRide(busId);
      if (ride == null) return;
      state = switch (ride.rideStatus) {
        RideStatus.active => RideActive(ride),
        RideStatus.destinationReached => RideDestinationReached(ride),
        _ => const RideIdle(),
      };
      // If there's already an active ride, resume GPS
      if (state is RideActive || state is RideDestinationReached) {
        await _startTracking(ride.id);
      }
    } catch (e) {
      // Non-critical: if check fails, user can manually start a ride
    }
  }

  // ── Start Ride ───────────────────────────────────────────────
  Future<void> startRide() async {
    state = const RideLoading();
    try {
      final ride = await _rides.startRide();
      state = RideActive(ride);
      await _startTracking(ride.id);
    } on RidesException catch (e) {
      state = RideError(e.message);
    } catch (e) {
      state = RideError('Failed to start ride: $e');
    }
  }

  // ── Mark Destination Reached ─────────────────────────────────
  Future<void> markDestinationReached() async {
    final current = state;
    if (current is! RideActive) return;

    state = const RideLoading();
    try {
      final ride = await _rides.markDestinationReached(current.ride.id);
      state = RideDestinationReached(ride);
    } on RidesException catch (e) {
      state = RideError(e.message);
    } catch (e) {
      state = RideError('Failed to mark destination: $e');
    }
  }

  // ── End Ride ─────────────────────────────────────────────────
  Future<void> endRide() async {
    final current = state;
    final rideId = switch (current) {
      RideActive(:final ride) => ride.id,
      RideDestinationReached(:final ride) => ride.id,
      _ => null,
    };
    if (rideId == null) return;

    state = const RideLoading();
    try {
      await _rides.endRide(rideId);
      state = const RideIdle();
      _stopTracking();
    } on RidesException catch (e) {
      state = RideError(e.message);
    } catch (e) {
      state = RideError('Failed to end ride: $e');
    }
  }

  // ── Internal Tracking Control ─────────────────────────────────
  Future<void> _startTracking(String rideId) async {
    await SocketManager.instance.connect();
    await GpsManager.instance.startRide(rideId);
    await _startForegroundService(rideId);
  }

  void _stopTracking() {
    GpsManager.instance.stopRide();
    SocketManager.instance.disconnect();
    _stopForegroundService();
  }

  Future<void> _startForegroundService(String rideId) async {
    FlutterForegroundTask.init(
      androidNotificationOptions: AndroidNotificationOptions(
        channelId: 'vels_tracking_channel',
        channelName: 'Bus Tracking',
        channelDescription: 'Live location streaming',
        channelImportance: NotificationChannelImportance.HIGH,
        priority: NotificationPriority.HIGH,
      ),
      iosNotificationOptions: const IOSNotificationOptions(
        showNotification: true,
        playSound: false,
      ),
      foregroundTaskOptions: ForegroundTaskOptions(
        eventAction: ForegroundTaskEventAction.repeat(5000),
        autoRunOnBoot: false,
        allowWifiLock: true,
      ),
    );

    await FlutterForegroundTask.startService(
      notificationTitle: 'Ride Active',
      notificationText: 'Streaming live location…',
      callback: _trackingTaskHandler,
    );
  }

  void _stopForegroundService() {
    FlutterForegroundTask.stopService();
  }
}

@pragma('vm:entry-point')
void _trackingTaskHandler() {
  FlutterForegroundTask.setTaskHandler(_TrackingTaskHandler());
}

class _TrackingTaskHandler extends TaskHandler {
  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {}

  @override
  void onRepeatEvent(DateTime timestamp) {
    // GPS stream is already running via GpsManager; nothing extra needed here.
  }

  @override
  Future<void> onDestroy(DateTime timestamp) async {}
}

// ─── Provider ─────────────────────────────────────────────────────────────

final rideProvider = StateNotifierProvider<RideNotifier, RideState>(
  (ref) => RideNotifier(
    ref.read(ridesServiceProvider),
    ref.read(sessionManagerProvider),
  ),
);

// ─── Connection Status ────────────────────────────────────────────────────

final connectionStatusProvider = StreamProvider<SocketConnectionStatus>(
  (_) => SocketManager.instance.statusStream,
);
