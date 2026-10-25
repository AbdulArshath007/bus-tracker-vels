class UserProfile {
  const UserProfile({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.phone,
    this.languagePref = 'en',
    this.themePref = 'system',
    this.department = 'Engineering & Technology',
    this.registerNumber = '2024VELS1089',
    this.assignedBusNumber = 'Bus #01',
    this.assignedRouteName = 'Route 14 - Tambaram to Campus',
    this.boardingStopName = 'Tambaram Sanatorium',
  });

  final String id;
  final String email;
  final String name;
  final String role;
  final String? phone;
  final String languagePref;
  final String themePref;
  final String department;
  final String registerNumber;
  final String assignedBusNumber;
  final String assignedRouteName;
  final String boardingStopName;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String? ?? 'student_guest',
      email: json['email'] as String? ?? 'student@vistas.ac.in',
      name: json['full_name'] as String? ?? json['name'] as String? ?? 'Student',
      role: json['role'] as String? ?? 'student',
      phone: json['phone'] as String?,
      languagePref: json['language_pref'] as String? ?? 'en',
      themePref: json['theme_pref'] as String? ?? 'system',
      department: json['department'] as String? ?? 'Engineering & Technology',
      registerNumber: json['register_number'] as String? ?? '2024VELS1089',
      assignedBusNumber: json['assigned_bus'] as String? ?? 'Bus #01',
      assignedRouteName: json['assigned_route'] as String? ?? 'Route 14 - Tambaram to Campus',
      boardingStopName: json['boarding_stop'] as String? ?? 'Tambaram Sanatorium',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'full_name': name,
    'role': role,
    'phone': phone,
    'language_pref': languagePref,
    'theme_pref': themePref,
    'department': department,
    'register_number': registerNumber,
    'assigned_bus': assignedBusNumber,
    'assigned_route': assignedRouteName,
    'boarding_stop': boardingStopName,
  };

  UserProfile copyWith({
    String? name,
    String? email,
    String? phone,
    String? languagePref,
    String? themePref,
    String? department,
    String? boardingStopName,
  }) {
    return UserProfile(
      id: id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role,
      phone: phone ?? this.phone,
      languagePref: languagePref ?? this.languagePref,
      themePref: themePref ?? this.themePref,
      department: department ?? this.department,
      registerNumber: registerNumber,
      assignedBusNumber: assignedBusNumber,
      assignedRouteName: assignedRouteName,
      boardingStopName: boardingStopName ?? this.boardingStopName,
    );
  }
}
