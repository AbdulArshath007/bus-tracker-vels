import 'package:latlong2/latlong.dart';
import 'package:vels_student/models/bus_location.dart';
import 'package:vels_student/models/route_stop.dart';

class BusService {
  BusService();

  // ─── Route 14 Stops (Tambaram to VELS Pallavaram Campus) ─────────────────
  static final List<RouteStop> mockStops = [
    const RouteStop(
      id: 'stop_1',
      routeId: 'route_14',
      stopName: 'Tambaram Railway Station',
      stopNameTa: 'தாம்பரம் ரயில் நிலையம்',
      sequenceNum: 1,
      latitude: 12.9249,
      longitude: 80.1278,
      scheduledTime: '07:30 AM',
      isPassed: true,
    ),
    const RouteStop(
      id: 'stop_2',
      routeId: 'route_14',
      stopName: 'Tambaram Sanatorium',
      stopNameTa: 'தாம்பரம் சானடோரியம்',
      sequenceNum: 2,
      latitude: 12.9362,
      longitude: 80.1345,
      scheduledTime: '07:42 AM',
      isPassed: true,
      isStudentStop: true,
    ),
    const RouteStop(
      id: 'stop_3',
      routeId: 'route_14',
      stopName: 'Chromepet MIT Flyover',
      stopNameTa: 'குரோம்பேட்டை எம்.ஐ.டி பாலம்',
      sequenceNum: 3,
      latitude: 12.9462,
      longitude: 80.1431,
      scheduledTime: '07:54 AM',
      isPassed: true,
    ),
    const RouteStop(
      id: 'stop_4',
      routeId: 'route_14',
      stopName: 'Pallavaram GST Road',
      stopNameTa: 'பல்லாவரம் ஜிஎസ്ടி சாலை',
      sequenceNum: 4,
      latitude: 12.9562,
      longitude: 80.1433,
      scheduledTime: '08:05 AM',
      isNext: true,
    ),
    const RouteStop(
      id: 'stop_5',
      routeId: 'route_14',
      stopName: 'Pammal Main Road Junction',
      stopNameTa: 'பம்மல் மெயின் ரோடு',
      sequenceNum: 5,
      latitude: 12.9663,
      longitude: 80.1487,
      scheduledTime: '08:15 AM',
      isPassed: false,
    ),
    const RouteStop(
      id: 'stop_6',
      routeId: 'route_14',
      stopName: 'VELS University Campus (Main Gate)',
      stopNameTa: 'வேல்ஸ் பல்கலைக்கழகம் (பிரதான வாசல்)',
      sequenceNum: 6,
      latitude: 12.964742,
      longitude: 80.151757,
      scheduledTime: '08:25 AM',
      isPassed: false,
    ),
  ];

  // ─── Accurate Route Polyline Waypoints from Campus Data ───────────────────
  static final List<LatLng> routePolyline = [
    const LatLng(12.9249, 80.1278),
    const LatLng(12.9300, 80.1310),
    const LatLng(12.9362, 80.1345),
    const LatLng(12.9403, 80.1380),
    const LatLng(12.9462, 80.1431),
    const LatLng(12.9507, 80.1440),
    const LatLng(12.9562, 80.1433),
    const LatLng(12.9610, 80.1465),
    const LatLng(12.9645, 80.1500),
    const LatLng(12.964742, 80.151757),
  ];

  // ─── Available University Bus Routes ──────────────────────────────────────
  static final List<Map<String, String>> availableBuses = [
    {
      'id': 'bus_1',
      'number': 'Bus #01',
      'route': 'Route 14 - Tambaram to Campus',
      'driver': 'Velan',
      'phone': '+91 98401 23456',
      'status': 'Live on Route',
    },
    {
      'id': 'bus_2',
      'number': 'Bus #04',
      'route': 'Route 08 - Guindy to Campus',
      'driver': 'Murugan',
      'phone': '+91 98402 34567',
      'status': 'Live on Route',
    },
    {
      'id': 'bus_3',
      'number': 'Bus #07',
      'route': 'Route 22 - Porur to Campus',
      'driver': 'Selvam',
      'phone': '+91 98403 45678',
      'status': 'Arrived Campus',
    },
    {
      'id': 'bus_4',
      'number': 'Bus #12',
      'route': 'Route 03 - Avadi to Campus',
      'driver': 'Karthik',
      'phone': '+91 98404 56789',
      'status': 'Scheduled (07:15 AM)',
    },
  ];

  Future<BusLocation> getLiveBusLocation(String busId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return BusLocation(
      busId: busId,
      busNumber: 'Bus #01 (Tambaram Route)',
      routeName: 'Route 14',
      driverName: 'Velan (Senior Driver)',
      driverPhone: '+91 98401 23456',
      latitude: 12.9562,
      longitude: 80.1433,
      speedKmh: 36.4,
      heading: 42.0,
      isLive: true,
      status: 'approaching',
      lastUpdated: DateTime.now(),
      etaMinutes: 8,
      nextStopName: 'Pallavaram GST Road',
      distanceKm: 2.1,
    );
  }

  Future<List<RouteStop>> getRouteStops(String routeId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return mockStops;
  }
}
