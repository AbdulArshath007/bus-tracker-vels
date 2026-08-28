import 'dart:convert';

import 'package:vels_driver/core/secure_storage.dart';
import 'package:vels_driver/models/user_profile.dart';

/// Manages user session state: tokens, profile, and expiry validation.
///
/// Fixes:
///   • #1  – Uses SecureStorage (AES-encrypted) instead of SharedPreferences.
///   • #4  – Checks JWT expiry locally before declaring the user logged-in.
class SessionManager {
  SessionManager._();

  static final SessionManager instance = SessionManager._();

  UserProfile? _cachedUser;

  // ─── Token Operations ──────────────────────────────────────────

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await SecureStorage.saveAccessToken(accessToken);
    await SecureStorage.saveRefreshToken(refreshToken);
  }

  Future<String?> getAccessToken() => SecureStorage.getAccessToken();
  Future<String?> getRefreshToken() => SecureStorage.getRefreshToken();

  // ─── User Profile ──────────────────────────────────────────────

  Future<void> saveUser(UserProfile user) async {
    _cachedUser = user;
    await SecureStorage.saveUserJson(jsonEncode(user.toJson()));
  }

  Future<UserProfile?> getUser() async {
    if (_cachedUser != null) return _cachedUser;
    final json = await SecureStorage.getUserJson();
    if (json == null) return null;
    try {
      _cachedUser = UserProfile.fromJson(
        jsonDecode(json) as Map<String, dynamic>,
      );
      return _cachedUser;
    } catch (_) {
      return null;
    }
  }

  // ─── Session Validity ──────────────────────────────────────────

  /// Returns true only if an access token exists AND is not expired.
  ///
  /// Decodes the JWT payload (base64url) locally — no library needed.
  /// Fixes vulnerability #4: the Kotlin version only checked token existence.
  Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    if (token == null || token.isEmpty) return false;
    return !_isJwtExpired(token);
  }

  /// Returns true if the JWT exp claim is in the past.
  bool _isJwtExpired(String jwt) {
    try {
      final parts = jwt.split('.');
      if (parts.length != 3) return true;

      // Base64url decode the payload (add padding if necessary)
      var payload = parts[1];
      payload = payload.replaceAll('-', '+').replaceAll('_', '/');
      final padded = payload.padRight(
        (payload.length + 3) & ~3,
        '=',
      );

      final decoded = utf8.decode(base64Decode(padded));
      final map = jsonDecode(decoded) as Map<String, dynamic>;
      final exp = map['exp'] as int?;
      if (exp == null) return true;

      final expiry = DateTime.fromMillisecondsSinceEpoch(exp * 1000, isUtc: true);
      // Add 30-second buffer to refresh slightly before actual expiry.
      return DateTime.now().toUtc().isAfter(
            expiry.subtract(const Duration(seconds: 30)),
          );
    } catch (_) {
      return true; // Treat malformed tokens as expired — fail secure.
    }
  }

  // ─── Logout ────────────────────────────────────────────────────

  Future<void> clear() async {
    _cachedUser = null;
    await SecureStorage.clearAll();
  }
}
