import 'package:vels_driver/app_config.dart';
import 'package:vels_driver/core/api_client.dart';
import 'package:vels_driver/core/session_manager.dart';
import 'package:vels_driver/models/user_profile.dart';

class AuthException implements Exception {
  const AuthException(this.message);
  final String message;
  @override
  String toString() => 'AuthException: $message';
}

/// Auth API service.
///
/// Fixes:
///   • #10 – Validates email format and minimum password length before
///            making any network call.
class AuthService {
  AuthService(this._session);

  final SessionManager _session;
  final _dio = ApiClient.instance.dio;

  // ─── Login ─────────────────────────────────────────────────────

  Future<void> login({
    required String email,
    required String password,
  }) async {
    // ── Input validation (fix #10) ─────────────────────────────
    final trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.isEmpty || !_isValidEmail(trimmedEmail)) {
      throw const AuthException('Please enter a valid email address.');
    }
    if (password.length < AppConfig.minPasswordLength) {
      throw AuthException(
        'Password must be at least ${AppConfig.minPasswordLength} characters.',
      );
    }

    final response = await _dio.post<Map<String, dynamic>>(
      'auth/login',
      data: {'email': trimmedEmail, 'password': password},
    );

    final data = _requireBody(response.data, 'Login');

    await _session.saveTokens(
      accessToken: data['access_token'] as String,
      refreshToken: data['refresh_token'] as String,
    );
    await _session.saveUser(
      UserProfile.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  // ─── Guest Login ───────────────────────────────────────────────

  Future<void> guestLogin() async {
    final response = await _dio.post<Map<String, dynamic>>(
      'auth/guest-login',
      data: {'role': 'driver'},
    );

    final data = _requireBody(response.data, 'Guest Login');

    await _session.saveTokens(
      accessToken: data['access_token'] as String,
      refreshToken: data['refresh_token'] as String,
    );
    await _session.saveUser(
      UserProfile.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  // ─── Update Profile ────────────────────────────────────────────

  Future<UserProfile> updateProfile({
    String? name,
    String? email,
    String? phone,
  }) async {
    final Map<String, dynamic> data = {};
    if (name != null) data['full_name'] = name;
    if (email != null) data['email'] = email;
    if (phone != null) data['phone'] = phone;

    final response = await _dio.patch<Map<String, dynamic>>(
      'users/me',
      data: data,
    );

    if (response.data == null) {
      throw const AuthException('Update failed: empty server response.');
    }

    final updated = UserProfile.fromJson(response.data!);
    await _session.saveUser(updated);
    return updated;
  }

  // ─── Logout ────────────────────────────────────────────────────

  Future<void> logout() async {
    final refreshToken = await _session.getRefreshToken();
    if (refreshToken != null) {
      try {
        await _dio.post<void>(
          'auth/logout',
          data: {'refresh_token': refreshToken},
        );
      } catch (_) {
        // Even if logout fails on the server, clear locally
      }
    }
    await _session.clear();
  }

  // ─── Helpers ───────────────────────────────────────────────────

  Map<String, dynamic> _requireBody(
    Map<String, dynamic>? body,
    String operation,
  ) {
    if (body == null) {
      throw AuthException('$operation failed: empty server response.');
    }
    return body;
  }

  bool _isValidEmail(String email) {
    // RFC-compliant email regex
    return RegExp(
      r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$',
    ).hasMatch(email);
  }
}
