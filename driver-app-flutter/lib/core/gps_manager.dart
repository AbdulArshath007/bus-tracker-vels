import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:vels_driver/core/socket_manager.dart';

/// Manages GPS location updates and streams them via Socket.IO.
///
/// Fixes:
///   • #6 – Offline queue is a proper List<Map>, serialized as JSON array.
class GpsManager {
  GpsManager._();

  static final GpsManager instance = GpsManager._();

  StreamSubscription<Position>? _locationSub;
  String? _currentRideId;
  bool _isActive = false;

  // Offline buffer: properly typed List<Map> — fixes vulnerability #6
  final List<Map<String, dynamic>> _offlineQueue = [];

  // ─── Start / Stop ──────────────────────────────────────────────

  Future<void> startRide(String rideId) async {
    _currentRideId = rideId;
    _isActive = true;

    // Listen to socket connection changes to flush the queue
    SocketManager.instance.statusStream.listen((status) {
      if (status == SocketConnectionStatus.connected && _isActive) {
        _flushOfflineQueue();
      }
    });

    await _startLocationUpdates();
  }

  void stopRide() {
    _isActive = false;
    _currentRideId = null;
    _locationSub?.cancel();
    _locationSub = null;
    _offlineQueue.clear();
  }

  // ─── Location Updates ──────────────────────────────────────────

  Future<void> _startLocationUpdates() async {
    final locationSettings = AndroidSettings(
      accuracy: LocationAccuracy.high,
      intervalDuration: Duration(milliseconds: 5000),
      distanceFilter: 10,
      foregroundNotificationConfig: ForegroundNotificationConfig(
        notificationText: 'Tracking your route',
        notificationTitle: 'Vels Bus Tracker',
        enableWakeLock: true,
      ),
    );

    _locationSub = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      _handlePosition,
      onError: (Object e) {
        if (kDebugMode) debugPrint('[GPS] Location stream error: $e');
      },
    );
  }

  void _handlePosition(Position position) {
    if (!_isActive || _currentRideId == null) return;

    final ping = _buildPing(position);

    if (SocketManager.instance.isConnected) {
      SocketManager.instance.emit('gps.ping', ping);
    } else {
      // Buffer for later flush
      _offlineQueue.add(ping);
      if (kDebugMode) {
        debugPrint('[GPS] Queued offline ping (queue size: ${_offlineQueue.length})');
      }
    }
  }

  Map<String, dynamic> _buildPing(Position position) => {
        'ride_id': _currentRideId,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'speed_kmh': (position.speed * 3.6).clamp(0.0, double.infinity),
        'heading': position.heading,
        'accuracy_m': position.accuracy,
        'altitude_m': position.altitude,
        'recorded_at': position.timestamp.toUtc().toIso8601String(),
      };

  // ─── Offline Queue Flush ───────────────────────────────────────

  /// Flushes the buffered pings to the server as a proper JSON array.
  ///
  /// Fixes vulnerability #6: the Kotlin version serialized localQueue using
  /// Gson into a JSON string and nested it inside another JSONObject, producing
  /// malformed JSON.  Here we send the list directly as a JSON array.
  void _flushOfflineQueue() {
    if (_offlineQueue.isEmpty) return;

    final payload = {
      'ride_id': _currentRideId,
      'pings': List<Map<String, dynamic>>.from(_offlineQueue), // proper array
    };

    SocketManager.instance.emitWithAck(
      'gps.local_queue_flush',
      payload,
      ackCallback: ([dynamic _]) {
        _offlineQueue.clear();
        if (kDebugMode) debugPrint('[GPS] Offline queue flushed successfully');
      },
    );
  }
}
