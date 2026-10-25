class RouteStop {
  const RouteStop({
    required this.id,
    required this.routeId,
    required this.stopName,
    this.stopNameTa,
    required this.sequenceNum,
    required this.latitude,
    required this.longitude,
    required this.scheduledTime,
    this.isPassed = false,
    this.isNext = false,
    this.isStudentStop = false,
  });

  final String id;
  final String routeId;
  final String stopName;
  final String? stopNameTa;
  final int sequenceNum;
  final double latitude;
  final double longitude;
  final String scheduledTime;
  final bool isPassed;
  final bool isNext;
  final bool isStudentStop;

  factory RouteStop.fromJson(Map<String, dynamic> json) {
    return RouteStop(
      id: json['id']?.toString() ?? '',
      routeId: json['route_id']?.toString() ?? '',
      stopName: json['stop_name'] as String? ?? 'Campus Stop',
      stopNameTa: json['stop_name_ta'] as String?,
      sequenceNum: json['sequence_num'] as int? ?? 1,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 12.964742,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 80.151757,
      scheduledTime: json['scheduled_time'] as String? ?? '08:00 AM',
      isPassed: json['is_passed'] as bool? ?? false,
      isNext: json['is_next'] as bool? ?? false,
      isStudentStop: json['is_student_stop'] as bool? ?? false,
    );
  }

  RouteStop copyWith({
    bool? isPassed,
    bool? isNext,
    bool? isStudentStop,
  }) {
    return RouteStop(
      id: id,
      routeId: routeId,
      stopName: stopName,
      stopNameTa: stopNameTa,
      sequenceNum: sequenceNum,
      latitude: latitude,
      longitude: longitude,
      scheduledTime: scheduledTime,
      isPassed: isPassed ?? this.isPassed,
      isNext: isNext ?? this.isNext,
      isStudentStop: isStudentStop ?? this.isStudentStop,
    );
  }
}
