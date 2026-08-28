import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:vels_driver/app_config.dart';
import 'package:vels_driver/core/session_manager.dart';

/// Singleton Dio instance with:
///   • Bearer token injected on every request.
///   • 401 → auto-refresh → retry (once).
///   • Debug-only logging interceptor.
///   • Proper error surfacing (no silent swallowing — fixes vulnerability #3).
class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  final _unauthorizedController = StreamController<void>.broadcast();
  Stream<void> get onSessionExpired => _unauthorizedController.stream;

  late final Dio dio = _buildDio();

  Dio _buildDio() {
    final options = BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Accept': 'application/json'},
    );

    final dio = Dio(options);

    // ─── Auth Interceptor ────────────────────────────────────────
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SessionManager.instance.getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Attempt silent token refresh
            final refreshed = await _tryRefresh(dio);
            if (refreshed) {
              // Retry the original request with the new token
              final retryOptions = error.requestOptions;
              final newToken = await SessionManager.instance.getAccessToken();
              retryOptions.headers['Authorization'] = 'Bearer $newToken';
              try {
                final response = await dio.fetch(retryOptions);
                return handler.resolve(response);
              } on DioException catch (e) {
                return handler.next(e);
              }
            }
            // Refresh failed — clear session so UI redirects to login
            await SessionManager.instance.clear();
            _unauthorizedController.add(null);
          }
          return handler.next(error);
        },
      ),
    );

    // ─── Debug Logging (never runs in release builds) ────────────
    if (kDebugMode) {
      dio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          logPrint: (obj) => debugPrint('[API] $obj'),
        ),
      );
    }

    return dio;
  }

  /// Attempts to refresh the access token using the stored refresh token.
  /// Returns true on success, false on failure.
  Future<bool> _tryRefresh(Dio dio) async {
    final refreshToken = await SessionManager.instance.getRefreshToken();
    if (refreshToken == null) return false;

    try {
      // Use a separate Dio instance to avoid interceptor recursion
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: AppConfig.baseUrl,
          connectTimeout: const Duration(seconds: 10),
        ),
      );
      final response = await refreshDio.post<Map<String, dynamic>>(
        'auth/refresh',
        data: {'refresh_token': refreshToken},
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data!;
        await SessionManager.instance.saveTokens(
          accessToken: data['access_token'] as String,
          refreshToken: data['refresh_token'] as String,
        );
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
