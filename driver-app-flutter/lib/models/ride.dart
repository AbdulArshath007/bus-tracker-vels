import 'package:json_annotation/json_annotation.dart';

part 'ride.g.dart';

enum RideStatus { idle, active, destinationReached, completed, unknown }

extension RideStatusX on RideStatus {
  static RideStatus fromString(String? s) => switch (s) {
        'active' => RideStatus.active,
        'destination_reached' => RideStatus.destinationReached,
        'completed' => RideStatus.completed,
        _ => RideStatus.unknown,
      };
}

@JsonSerializable()
class Ride {
  const Ride({
    required this.id,
    required this.busId,
    required this.driverId,
    required this.status,
    required this.startedAt,
  });

  final String id;

  @JsonKey(name: 'bus_id')
  final String busId;

  @JsonKey(name: 'driver_id')
  final String driverId;

  final String status;

  @JsonKey(name: 'started_at')
  final String startedAt;

  RideStatus get rideStatus => RideStatusX.fromString(status);

  factory Ride.fromJson(Map<String, dynamic> json) => _$RideFromJson(json);
  Map<String, dynamic> toJson() => _$RideToJson(this);
}
