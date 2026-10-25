import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:vels_student/models/user_profile.dart';

class SessionManager {
  SessionManager._();
  static final SessionManager instance = SessionManager._();

  static const _kAccessToken = 'access_token';
  static const _kRefreshToken = 'refresh_token';
  static const _kUserProfile = 'user_profile';

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  UserProfile? _cachedUser;

  // ─── Token Management ──────────────────────────────────────────

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _kAccessToken, value: accessToken),
      _storage.write(key: _kRefreshToken, value: refreshToken),
    ]);
  }

  Future<String?> getAccessToken() => _storage.read(key: _kAccessToken);
  Future<String?> getRefreshToken() => _storage.read(key: _kRefreshToken);

  // ─── User Profile Cache ────────────────────────────────────────

  Future<void> saveUser(UserProfile user) async {
    _cachedUser = user;
    await _storage.write(key: _kUserProfile, value: jsonEncode(user.toJson()));
  }

  Future<UserProfile?> getUser() async {
    if (_cachedUser != null) return _cachedUser;
    final raw = await _storage.read(key: _kUserProfile);
    if (raw == null) return null;
    try {
      _cachedUser = UserProfile.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      return _cachedUser;
    } catch (_) {
      return null;
    }
  }

  Future<bool> hasValidSession() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> clear() async {
    _cachedUser = null;
    await _storage.deleteAll();
  }
}
