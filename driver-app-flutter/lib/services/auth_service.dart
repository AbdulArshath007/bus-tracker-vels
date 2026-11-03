import 'package:vels_driver/core/api_client.dart';
import 'package:vels_driver/core/session_manager.dart';
import 'package:vels_driver/models/user_profile.dart';

class AuthException implements Exception {
  const AuthException(this.message);
  final String message;
  @override
  String toString() => 'AuthException: $message';
}

/// Auth API service with instant mock login support for Driver & Student.
class AuthService {
  AuthService(this._session);

  final SessionManager _session;
  final _dio = ApiClient.instance.dio;

  // ─── Role-Based Mock Login (No DB / No Verification) ───────────

  Future<UserProfile> loginWithRole({
    required String role,
    String? email,
    String? password,
  }) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final isDriver = role.toLowerCase().trim() == 'driver';

    final user = isDriver
        ? UserProfile(
            id: 'driver_velan',
            email: (email != null && email.isNotEmpty) ? email : 'driver@vels.edu',
            name: 'Velan (Driver)',
            role: 'driver',
            busId: 'bus_1',
            routeId: 'route_14',
            assignedBusNumber: 'Bus #01',
            assignedRouteName: 'Route 14 - Tambaram to Campus',
            phone: '+91 98401 23456',
          )
        : UserProfile(
            id: 'student_rahul',
            email: (email != null && email.isNotEmpty) ? email : 'student@vistas.ac.in',
            name: 'Rahul (CSE)',
            role: 'student',
            busId: 'bus_1',
            routeId: 'route_14',
            registerNumber: '2024VELS1089',
            department: 'Computer Science & Engineering',
            assignedBusNumber: 'Bus #01',
            assignedRouteName: 'Route 14 - Tambaram to Campus',
            boardingStopName: 'Tambaram Sanatorium',
            phone: '+91 98401 23456',
          );

    await _session.saveTokens(
      accessToken: 'dummy_access_token_${user.id}',
      refreshToken: 'dummy_refresh_token_${user.id}',
    );
    await _session.saveUser(user);
    return user;
  }

  // ─── Backward-compatible Login ─────────────────────────────────

  Future<void> login({
    required String email,
    required String password,
    String role = 'driver',
  }) async {
    await loginWithRole(role: role, email: email, password: password);
  }

  // ─── Guest Login ───────────────────────────────────────────────

  Future<void> guestLogin({String role = 'driver'}) async {
    await loginWithRole(role: role);
  }

  // ─── Update Profile ────────────────────────────────────────────

  Future<UserProfile> updateProfile({
    String? name,
    String? email,
    String? phone,
    String? boardingStopName,
    String? languagePref,
  }) async {
    final current = await _session.getUser();
    final updated = (current ?? const UserProfile(id: 'me', name: 'User', role: 'driver')).copyWith(
      name: name,
      email: email,
      phone: phone,
      boardingStopName: boardingStopName,
      languagePref: languagePref,
    );
    await _session.saveUser(updated);

    try {
      final Map<String, dynamic> data = {};
      if (name != null) data['full_name'] = name;
      if (email != null) data['email'] = email;
      if (phone != null) data['phone'] = phone;

      await _dio.patch<Map<String, dynamic>>('users/me', data: data);
    } catch (_) {
      // Offline fallback: locally updated
    }

    return updated;
  }

  // ─── Logout ────────────────────────────────────────────────────

  Future<void> logout() async {
    await _session.clear();
  }
}
