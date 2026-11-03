import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:vels_driver/app_config.dart';

Position createMockPosition({double lat = AppConfig.defaultLat, double lng = AppConfig.defaultLng}) {
  return Position(
    latitude: lat,
    longitude: lng,
    timestamp: DateTime.now(),
    accuracy: 5.0,
    altitude: 10.0,
    altitudeAccuracy: 1.0,
    heading: 0.0,
    headingAccuracy: 1.0,
    speed: 0.0,
    speedAccuracy: 0.0,
  );
}

final locationProvider = StreamProvider.autoDispose<Position>((ref) async* {
  try {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      // Yield mock location instead of crashing
      yield createMockPosition();
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        yield createMockPosition();
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      yield createMockPosition();
      return;
    }

    // Try getting immediate current position first
    try {
      final current = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 4),
      );
      yield current;
    } catch (_) {
      yield createMockPosition();
    }

    // Then continuously stream real device position updates
    yield* Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 5,
      ),
    );
  } catch (_) {
    // Ultimate fallback to mock device location
    yield createMockPosition();
  }
});
