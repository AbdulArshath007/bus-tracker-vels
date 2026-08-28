import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Typed, secure key-value storage backed by the Android Keystore /
/// iOS Keychain through flutter_secure_storage.
///
/// Fixes vulnerability #1: tokens were stored in plain SharedPreferences.
class SecureStorage {
  SecureStorage._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      // Requires user authentication (lock-screen) before reading.
      // Set to false if biometric lock is not required.
      keyCipherAlgorithm: KeyCipherAlgorithm.RSA_ECB_OAEPwithSHA_256andMGF1Padding,
      storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  // ─── Keys ──────────────────────────────────────────────────────
  static const _kAccessToken = 'access_token';
  static const _kRefreshToken = 'refresh_token';
  static const _kUserJson = 'user_profile';

  // ─── Access Token ──────────────────────────────────────────────
  static Future<void> saveAccessToken(String token) =>
      _storage.write(key: _kAccessToken, value: token);

  static Future<String?> getAccessToken() =>
      _storage.read(key: _kAccessToken);

  // ─── Refresh Token ─────────────────────────────────────────────
  static Future<void> saveRefreshToken(String token) =>
      _storage.write(key: _kRefreshToken, value: token);

  static Future<String?> getRefreshToken() =>
      _storage.read(key: _kRefreshToken);

  // ─── User Profile JSON ─────────────────────────────────────────
  static Future<void> saveUserJson(String json) =>
      _storage.write(key: _kUserJson, value: json);

  static Future<String?> getUserJson() =>
      _storage.read(key: _kUserJson);

  // ─── Clear All ─────────────────────────────────────────────────
  static Future<void> clearAll() => _storage.deleteAll();
}
