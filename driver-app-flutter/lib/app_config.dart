/// App-level configuration loaded from --dart-define at build time.
///
/// Build with:
///   flutter build apk --dart-define=BASE_URL=https://api.vels-bustracker.com
///
/// NEVER hardcode secrets or URLs directly in source code.
library app_config;

class AppConfig {
  AppConfig._();

  /// Base URL for REST API calls.
  /// Override at build time:
  ///   `flutter build apk --dart-define=BASE_URL=https://your-api.com/v1/`
  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/v1/',
  );

  /// Socket.IO server URL.
  /// Override at build time:
  ///   `flutter build apk --dart-define=SOCKET_URL=https://your-api.com`
  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// Minimum GPS update interval in milliseconds.
  static const int gpsIntervalMs = 5000;

  /// Minimum GPS displacement in metres before an update is emitted.
  static const double gpsDistanceFilterM = 10.0;

  /// Fraction of swipe button that must be crossed before triggering.
  static const double swipeThreshold = 0.8;

  /// Maximum characters allowed in a chat message.
  static const int chatMaxLength = 1000;

  /// Minimum password length accepted at login.
  static const int minPasswordLength = 6;
}
