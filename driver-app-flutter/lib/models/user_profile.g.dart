// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_profile.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserProfile _$UserProfileFromJson(Map<String, dynamic> json) => UserProfile(
      id: json['id'] as String,
      email: json['email'] as String?,
      name: json['fullName'] as String,
      role: json['role'] as String,
      phone: json['phone'] as String?,
      busId: json['bus_id'] as String?,
      routeId: json['route_id'] as String?,
    );

Map<String, dynamic> _$UserProfileToJson(UserProfile instance) =>
    <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'fullName': instance.name,
      'role': instance.role,
      'phone': instance.phone,
      'bus_id': instance.busId,
      'route_id': instance.routeId,
    };
