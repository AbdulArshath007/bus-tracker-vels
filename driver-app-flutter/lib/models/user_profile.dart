class UserProfile {
  const UserProfile({
    required this.id,
    this.email,
    required this.name,
    required this.role,
    this.phone,
    this.busId,
    this.routeId,
    this.department = 'Engineering & Technology',
    this.registerNumber = '2024VELS1089',
    this.assignedBusNumber = 'Bus #01',
    this.assignedRouteName = 'Route 14 - Tambaram to Campus',
    this.boardingStopName = 'Tambaram Sanatorium',
    this.languagePref = 'en',
    this.themePref = 'system',
  });

  final String id;
  final String? email;
  final String name;
  final String role;
  final String? phone;
  final String? busId;
  final String? routeId;
  final String? department;
  final String? registerNumber;
  final String? assignedBusNumber;
  final String? assignedRouteName;
  final String? boardingStopName;
  final String languagePref;
  final String themePref;

  bool get isDriver => role.toLowerCase() == 'driver';
  bool get isStudent => role.toLowerCase() == 'student';

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id']?.toString() ?? 'user_default',
      email: json['email'] as String?,
      name: json['fullName'] as String? ?? json['name'] as String? ?? 'User',
      role: json['role'] as String? ?? 'driver',
      phone: json['phone'] as String?,
      busId: json['bus_id'] as String? ?? json['busId'] as String?,
      routeId: json['route_id'] as String? ?? json['routeId'] as String?,
      department: json['department'] as String? ?? 'Engineering & Technology',
      registerNumber: json['register_number'] as String? ?? json['registerNumber'] as String? ?? '2024VELS1089',
      assignedBusNumber: json['assigned_bus'] as String? ?? json['assignedBusNumber'] as String? ?? 'Bus #01',
      assignedRouteName: json['assigned_route'] as String? ?? json['assignedRouteName'] as String? ?? 'Route 14 - Tambaram to Campus',
      boardingStopName: json['boarding_stop'] as String? ?? json['boardingStopName'] as String? ?? 'Tambaram Sanatorium',
      languagePref: json['language_pref'] as String? ?? json['languagePref'] as String? ?? 'en',
      themePref: json['theme_pref'] as String? ?? json['themePref'] as String? ?? 'system',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'fullName': name,
    'role': role,
    'phone': phone,
    'bus_id': busId,
    'route_id': routeId,
    'department': department,
    'register_number': registerNumber,
    'assigned_bus': assignedBusNumber,
    'assigned_route': assignedRouteName,
    'boarding_stop': boardingStopName,
    'language_pref': languagePref,
    'theme_pref': themePref,
  };

  UserProfile copyWith({
    String? name,
    String? email,
    String? phone,
    String? busId,
    String? routeId,
    String? department,
    String? registerNumber,
    String? assignedBusNumber,
    String? assignedRouteName,
    String? boardingStopName,
    String? languagePref,
    String? themePref,
  }) {
    return UserProfile(
      id: id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role,
      phone: phone ?? this.phone,
      busId: busId ?? this.busId,
      routeId: routeId ?? this.routeId,
      department: department ?? this.department,
      registerNumber: registerNumber ?? this.registerNumber,
      assignedBusNumber: assignedBusNumber ?? this.assignedBusNumber,
      assignedRouteName: assignedRouteName ?? this.assignedRouteName,
      boardingStopName: boardingStopName ?? this.boardingStopName,
      languagePref: languagePref ?? this.languagePref,
      themePref: themePref ?? this.themePref,
    );
  }
}
