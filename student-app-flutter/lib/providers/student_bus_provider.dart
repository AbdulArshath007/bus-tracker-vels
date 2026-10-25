import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:vels_student/core/socket_manager.dart';
import 'package:vels_student/models/bus_location.dart';
import 'package:vels_student/models/route_stop.dart';
import 'package:vels_student/services/bus_service.dart';

// ─── Student Tracking State ───────────────────────────────────────────────

class StudentTrackingState {
  const StudentTrackingState({
    required this.selectedBusId,
    required this.busLocation,
    required this.stops,
    required this.routePath,
    this.studentLocation,
    this.isLoading = false,
    this.errorMessage,
    this.hasActiveRide = true,
  });

  final String selectedBusId;
  final BusLocation busLocation;
  final List<RouteStop> stops;
  final List<LatLng> routePath;
  final LatLng? studentLocation;
  final bool isLoading;
  final String? errorMessage;
  final bool hasActiveRide;

  StudentTrackingState copyWith({
    String? selectedBusId,
    BusLocation? busLocation,
    List<RouteStop>? stops,
    List<LatLng>? routePath,
    LatLng? studentLocation,
    bool? isLoading,
    String? errorMessage,
    bool? hasActiveRide,
  }) {
    return StudentTrackingState(
      selectedBusId: selectedBusId ?? this.selectedBusId,
      busLocation: busLocation ?? this.busLocation,
      stops: stops ?? this.stops,
      routePath: routePath ?? this.routePath,
      studentLocation: studentLocation ?? this.studentLocation,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      hasActiveRide: hasActiveRide ?? this.hasActiveRide,
    );
  }
}

// ─── Notifier ─────────────────────────────────────────────────────────────

class StudentBusNotifier extends StateNotifier<StudentTrackingState> {
  StudentBusNotifier(this._busService)
      : super(
          StudentTrackingState(
            selectedBusId: 'bus_1',
            busLocation: BusLocation(
              busId: 'bus_1',
              busNumber: 'Bus #01',
              routeName: 'Route 14 - Tambaram to Campus',
              driverName: 'Velan',
              driverPhone: '+91 98401 23456',
              latitude: 12.9562,
              longitude: 80.1433,
              speedKmh: 34.0,
              heading: 45.0,
              isLive: true,
              status: 'active',
              lastUpdated: DateTime.now(),
              etaMinutes: 8,
              nextStopName: 'Pallavaram GST Road',
              distanceKm: 2.1,
            ),
            stops: BusService.mockStops,
            routePath: BusService.routePolyline,
          ),
        ) {
    _initTracking();
  }

  final BusService _busService;
  Timer? _simulationTimer;
  int _simulationIndex = 0;

  Future<void> _initTracking() async {
    // 1. Fetch initial bus location & route stops
    try {
      final loc = await _busService.getLiveBusLocation(state.selectedBusId);
      final stops = await _busService.getRouteStops(loc.routeName);
      state = state.copyWith(
        busLocation: loc,
        stops: stops,
      );
    } catch (_) {}

    // 2. Fetch current student GPS position
    _determineStudentPosition();

    // 3. Connect to real-time WebSocket
    _setupSocketListeners();

    // 4. Start smooth demo path simulator so UI stays interactive even offline
    _startSimulatedMotion();
  }

  Future<void> _determineStudentPosition() async {
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse) {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
        );
        state = state.copyWith(
          studentLocation: LatLng(pos.latitude, pos.longitude),
        );
      } else {
        // Fallback default: Chromepet student boarding point
        state = state.copyWith(
          studentLocation: const LatLng(12.9462, 80.1431),
        );
      }
    } catch (_) {
      state = state.copyWith(
        studentLocation: const LatLng(12.9462, 80.1431),
      );
    }
  }

  void _setupSocketListeners() {
    final socket = SocketManager.instance;
    socket.connect();
    socket.joinBusRoom(state.selectedBusId);

    // Live GPS broadcast from backend
    socket.on('gps.broadcast', (data) {
      if (data == null || !mounted) return;
      try {
        final map = data as Map<String, dynamic>;
        if (map['bus_id'] == state.selectedBusId || map['busId'] == state.selectedBusId) {
          final lat = (map['latitude'] as num?)?.toDouble() ?? state.busLocation.latitude;
          final lng = (map['longitude'] as num?)?.toDouble() ?? state.busLocation.longitude;
          final speed = (map['speed_kmh'] as num?)?.toDouble() ?? state.busLocation.speedKmh;
          final heading = (map['heading'] as num?)?.toDouble() ?? state.busLocation.heading;

          _updateTelemetry(lat: lat, lng: lng, speed: speed, heading: heading, isLive: true);
        }
      } catch (e) {
        if (kDebugMode) debugPrint('[StudentBusNotifier] Parse error: $e');
      }
    });

    socket.on('ride.destination_reached', (_) {
      if (!mounted) return;
      state = state.copyWith(
        busLocation: state.busLocation.copyWith(
          status: 'destination_reached',
          nextStopName: 'Campus Reached',
          etaMinutes: 0,
        ),
      );
    });
  }

  void _updateTelemetry({
    required double lat,
    required double lng,
    required double speed,
    required double heading,
    required bool isLive,
  }) {
    // Recalculate ETA and distance to student location
    double distanceKm = 1.8;
    int eta = 5;

    if (state.studentLocation != null) {
      final d = _calculateDistanceKm(
        lat,
        lng,
        state.studentLocation!.latitude,
        state.studentLocation!.longitude,
      );
      distanceKm = double.parse(d.toStringAsFixed(1));
      // Approximate ETA based on current speed or 25 km/h in city
      final effectiveSpeed = speed > 5 ? speed : 25.0;
      eta = math.max(1, ((distanceKm / effectiveSpeed) * 60).round());
    }

    // Determine status
    String status = 'active';
    if (distanceKm <= 1.0) {
      status = 'approaching';
    }

    state = state.copyWith(
      busLocation: state.busLocation.copyWith(
        latitude: lat,
        longitude: lng,
        speedKmh: speed,
        heading: heading,
        isLive: isLive,
        status: status,
        distanceKm: distanceKm,
        etaMinutes: eta,
        lastUpdated: DateTime.now(),
      ),
    );
  }

  void selectBus(String busId) {
    if (busId == state.selectedBusId) return;
    SocketManager.instance.joinBusRoom(busId);
    state = state.copyWith(
      selectedBusId: busId,
      isLoading: true,
    );

    // Load selected bus info
    final match = BusService.availableBuses.firstWhere(
      (b) => b['id'] == busId,
      orElse: () => BusService.availableBuses.first,
    );

    state = state.copyWith(
      isLoading: false,
      busLocation: state.busLocation.copyWith(
        routeName: match['route'] ?? 'Campus Route',
        driverName: match['driver'] ?? 'Driver',
        driverPhone: match['phone'] ?? '+91 98400 00000',
      ),
    );
  }

  void _startSimulatedMotion() {
    _simulationTimer?.cancel();
    _simulationTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      final points = BusService.routePolyline;
      if (points.isEmpty) return;

      _simulationIndex = (_simulationIndex + 1) % points.length;
      final pt = points[_simulationIndex];

      // Add gentle variance
      final nextPt = points[(_simulationIndex + 1) % points.length];
      final heading = _calculateBearing(pt, nextPt);

      _updateTelemetry(
        lat: pt.latitude,
        lng: pt.longitude,
        speed: 32.0 + (math.Random().nextInt(8) - 4),
        heading: heading,
        isLive: true,
      );
    });
  }

  double _calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295;
    final a = 0.5 -
        math.cos((lat2 - lat1) * p) / 2 +
        math.cos(lat1 * p) * math.cos(lat2 * p) * (1 - math.cos((lon2 - lon1) * p)) / 2;
    return 12742 * math.asin(math.sqrt(a));
  }

  double _calculateBearing(LatLng start, LatLng end) {
    final lat1 = start.latitude * (math.pi / 180);
    final lon1 = start.longitude * (math.pi / 180);
    final lat2 = end.latitude * (math.pi / 180);
    final lon2 = end.longitude * (math.pi / 180);

    final dLon = lon2 - lon1;
    final y = math.sin(dLon) * math.cos(lat2);
    final x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dLon);

    final radians = math.atan2(y, x);
    return (radians * (180 / math.pi) + 360) % 360;
  }

  @override
  void dispose() {
    _simulationTimer?.cancel();
    super.dispose();
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────

final busServiceProvider = Provider<BusService>((_) => BusService());

final studentBusProvider =
    StateNotifierProvider<StudentBusNotifier, StudentTrackingState>(
  (ref) => StudentBusNotifier(ref.read(busServiceProvider)),
);
