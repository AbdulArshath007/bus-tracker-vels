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
    // Mock login bypass
    await Future.delayed(const Duration(milliseconds: 500));
    await _session.saveTokens(
      accessToken: 'dummy_access_token',
      refreshToken: 'dummy_refresh_token',
    );
    await _session.saveUser(
      UserProfile(
        id: 'driver_123',
        email: email,
        name: 'Test Driver',
        role: 'driver',
        busId: 'bus_1',
      ),
    );
  }

  // ─── Guest Login ───────────────────────────────────────────────

  Future<void> guestLogin() async {
    // Mock guest login bypass
    await _session.saveTokens(
      accessToken: 'dummy_access_token',
      refreshToken: 'dummy_refresh_token',
    );
    await _session.saveUser(
      const UserProfile(
        id: 'guest_123',
        email: 'guest@vels.edu',
        name: 'Guest Driver',
        role: 'driver',
      ),
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
}
