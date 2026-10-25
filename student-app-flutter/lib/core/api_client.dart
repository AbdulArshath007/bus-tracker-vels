import 'package:dio/dio.dart';
import 'package:vels_student/app_config.dart';
import 'package:vels_student/core/session_manager.dart';

class ApiClient {
  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SessionManager.instance.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          // Token expired or invalid
          if (error.response?.statusCode == 401) {
            await SessionManager.instance.clear();
          }
          return handler.next(error);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._();
  late final Dio _dio;
  Dio get dio => _dio;
}
