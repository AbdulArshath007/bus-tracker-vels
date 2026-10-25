class BusLocation {
  const BusLocation({
    required this.busId,
    required this.busNumber,
    required this.routeName,
    required this.driverName,
    required this.driverPhone,
    required this.latitude,
    required this.longitude,
    required this.speedKmh,
    required this.heading,
    required this.isLive,
    required this.status,
    required this.lastUpdated,
    this.etaMinutes = 12,
    this.nextStopName = 'Pallavaram GST Road',
    this.distanceKm = 3.2,
  });

  final String busId;
  final String busNumber;
  final String routeName;
  final String driverName;
  final String driverPhone;
  final double latitude;
  final double longitude;
  final double speedKmh;
  final double heading;
  final bool isLive;
  final String status; // 'active', 'approaching', 'destination_reached', 'offline'
  final DateTime lastUpdated;
  final int etaMinutes;
  final String nextStopName;
  final double distanceKm;

  factory BusLocation.fromJson(Map<String, dynamic> json) {
    return BusLocation(
      busId: json['bus_id']?.toString() ?? 'bus_1',
      busNumber: json['bus_number'] as String? ?? 'Bus #01 (Pallavaram)',
      routeName: json['route_name'] as String? ?? 'Route 14',
      driverName: json['driver_name'] as String? ?? 'Velan (Driver)',
      driverPhone: json['driver_phone'] as String? ?? '+91 98765 43210',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 12.964742,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 80.151757,
      speedKmh: (json['speed_kmh'] as num?)?.toDouble() ?? 28.5,
      heading: (json['heading'] as num?)?.toDouble() ?? 0.0,
      isLive: json['is_live'] as bool? ?? true,
      status: json['status'] as String? ?? 'active',
      lastUpdated: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
      etaMinutes: json['eta_minutes'] as int? ?? 12,
      nextStopName: json['next_stop_name'] as String? ?? 'Pallavaram GST Road',
      distanceKm: (json['distance_km'] as num?)?.toDouble() ?? 3.2,
    );
  }

  BusLocation copyWith({
    double? latitude,
    double? longitude,
    double? speedKmh,
    double? heading,
    bool? isLive,
    String? status,
    DateTime? lastUpdated,
    int? etaMinutes,
    String? nextStopName,
    double? distanceKm,
  }) {
    return BusLocation(
      busId: busId,
      busNumber: busNumber,
      routeName: routeName,
      driverName: driverName,
      driverPhone: driverPhone,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      speedKmh: speedKmh ?? this.speedKmh,
      heading: heading ?? this.heading,
      isLive: isLive ?? this.isLive,
      status: status ?? this.status,
      lastUpdated: lastUpdated ?? this.lastUpdated,
      etaMinutes: etaMinutes ?? this.etaMinutes,
      nextStopName: nextStopName ?? this.nextStopName,
      distanceKm: distanceKm ?? this.distanceKm,
    );
  }
}
