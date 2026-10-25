import 'package:vels_driver/models/ride.dart';

class RidesException implements Exception {
  const RidesException(this.message);
  final String message;
  @override
  String toString() => 'RidesException: $message';
}

/// Rides API service — wraps all ride lifecycle endpoints.
class RidesService {
  RidesService();

  // ─── Start a new ride ──────────────────────────────────────────

  Future<Ride> startRide() async {
    await Future.delayed(const Duration(seconds: 1)); // simulate delay
    return Ride(id: 'mock_ride_1', busId: 'bus_1', driverId: 'guest_123', status: 'active', startedAt: DateTime.now().toIso8601String());
  }

  // ─── Get active ride for a bus ────────────────────────────────

  Future<Ride?> getActiveRide(String busId) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return null;
  }

  // ─── Mark destination reached ─────────────────────────────────

  Future<Ride> markDestinationReached(String rideId) async {
    await Future.delayed(const Duration(seconds: 1));
    return Ride(id: 'mock_ride_1', busId: 'bus_1', driverId: 'guest_123', status: 'destination_reached', startedAt: DateTime.now().toIso8601String());
  }

  // ─── End ride ─────────────────────────────────────────────────

  Future<Ride> endRide(String rideId) async {
    await Future.delayed(const Duration(seconds: 1));
    return Ride(id: 'mock_ride_1', busId: 'bus_1', driverId: 'guest_123', status: 'completed', startedAt: DateTime.now().toIso8601String());
  }
}
