import 'package:vels_driver/core/api_client.dart';
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

  final _dio = ApiClient.instance.dio;

  // ─── Start a new ride ──────────────────────────────────────────

  Future<Ride> startRide() async {
    final response = await _dio.post<Map<String, dynamic>>('rides');
    return _parseRide(response.data, 'startRide');
  }

  // ─── Get active ride for a bus ────────────────────────────────

  Future<Ride?> getActiveRide(String busId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      'rides/active',
      queryParameters: {'bus_id': busId},
    );
    if (response.statusCode == 404 || response.data == null) return null;
    return Ride.fromJson(response.data!);
  }

  // ─── Mark destination reached ─────────────────────────────────

  Future<Ride> markDestinationReached(String rideId) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      'rides/$rideId/destination-reached',
    );
    return _parseRide(response.data, 'markDestinationReached');
  }

  // ─── End ride ─────────────────────────────────────────────────

  Future<Ride> endRide(String rideId) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      'rides/$rideId/end',
    );
    return _parseRide(response.data, 'endRide');
  }

  // ─── Helpers ──────────────────────────────────────────────────

  Ride _parseRide(Map<String, dynamic>? data, String operation) {
    if (data == null) {
      throw RidesException('$operation: server returned empty body.');
    }
    return Ride.fromJson(data);
  }
}
