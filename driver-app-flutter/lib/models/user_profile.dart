import 'package:json_annotation/json_annotation.dart';

part 'user_profile.g.dart';

@JsonSerializable()
class UserProfile {
  const UserProfile({
    required this.id,
    this.email,
    required this.name,
    required this.role,
    this.phone,
    this.busId,
    this.routeId,
  });

  final String id;
  final String? email;

  @JsonKey(name: 'fullName')
  final String name;

  final String role;
  final String? phone;

  @JsonKey(name: 'bus_id')
  final String? busId;

  @JsonKey(name: 'route_id')
  final String? routeId;

  factory UserProfile.fromJson(Map<String, dynamic> json) =>
      _$UserProfileFromJson(json);

  Map<String, dynamic> toJson() => _$UserProfileToJson(this);

  UserProfile copyWith({
    String? name,
    String? email,
    String? phone,
  }) {
    return UserProfile(
      id: id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role,
      phone: phone ?? this.phone,
      busId: busId,
      routeId: routeId,
    );
  }
}
