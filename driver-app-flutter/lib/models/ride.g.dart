// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ride.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Ride _$RideFromJson(Map<String, dynamic> json) => Ride(
      id: json['id'] as String,
      busId: json['bus_id'] as String,
      driverId: json['driver_id'] as String,
      status: json['status'] as String,
      startedAt: json['started_at'] as String,
    );

Map<String, dynamic> _$RideToJson(Ride instance) => <String, dynamic>{
      'id': instance.id,
      'bus_id': instance.busId,
      'driver_id': instance.driverId,
      'status': instance.status,
      'started_at': instance.startedAt,
    };
