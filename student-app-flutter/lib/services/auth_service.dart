import 'package:vels_student/core/session_manager.dart';
import 'package:vels_student/models/user_profile.dart';

class AuthException implements Exception {
  const AuthException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class AuthService {
  AuthService(this._session);
  final SessionManager _session;

  // ─── Login ──────────────────────────────────────────────────────────────

  Future<UserProfile> login({
    required String email,
    required String password,
  }) async {
    // Simulate network delay for smooth UI feedback
    await Future.delayed(const Duration(milliseconds: 600));

    final cleanEmail = email.trim().toLowerCase();

    // Verification: allow student demo access or real student format
    if (cleanEmail.isEmpty || password.isEmpty) {
      throw const AuthException('Please enter both email/register number and password.');
    }

    final user = UserProfile(
      id: 'student_vels_${cleanEmail.hashCode.abs().toString().substring(0, 4)}',
      email: cleanEmail.contains('@') ? cleanEmail : '$cleanEmail@vistas.ac.in',
      name: cleanEmail.split('@').first.toUpperCase(),
      role: 'student',
      phone: '+91 98401 23456',
      department: 'Computer Science & Engineering',
      registerNumber: cleanEmail.replaceAll('@vistas.ac.in', '').toUpperCase(),
      assignedBusNumber: 'Bus #01',
      assignedRouteName: 'Route 14 - Tambaram to Campus',
      boardingStopName: 'Tambaram Sanatorium',
    );

    await _session.saveTokens(
      accessToken: 'mock_jwt_token_student_${user.id}',
      refreshToken: 'mock_refresh_token_student_${user.id}',
    );
    await _session.saveUser(user);

    return user;
  }

  // ─── Guest / Quick Student Login ────────────────────────────────────────

  Future<UserProfile> loginAsGuest() async {
    return login(
      email: 'student@vistas.ac.in',
      password: 'demo_password',
    );
  }

  // ─── Update Profile ─────────────────────────────────────────────────────

  Future<UserProfile> updateProfile({
    String? name,
    String? phone,
    String? boardingStopName,
    String? themePref,
    String? languagePref,
  }) async {
    final current = await _session.getUser();
    if (current == null) throw const AuthException('No active user session');

    final updated = current.copyWith(
      name: name,
      phone: phone,
      boardingStopName: boardingStopName,
      themePref: themePref,
      languagePref: languagePref,
    );

    await _session.saveUser(updated);
    return updated;
  }

  // ─── Logout ─────────────────────────────────────────────────────────────

  Future<void> logout() async {
    await _session.clear();
  }
}
