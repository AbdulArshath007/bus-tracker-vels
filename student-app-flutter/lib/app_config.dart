/// Application-wide constants & environment configuration for Vels Student App.
class AppConfig {
  AppConfig._();

  /// University Name & Branding
  static const String appName = 'VELS Student Bus Tracker';
  static const String institutionName = 'VELS Institute of Science, Technology & Advanced Studies';
  static const String institutionShort = 'VISTAS';

  /// Base URL for REST API calls.
  /// Override at build time:
  ///   `flutter build apk --dart-define=BASE_URL=https://your-api.com/v1/`
  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/v1/',
  );

  /// WebSocket URL for real-time bus location and route chat.
  /// Override at build time:
  ///   `flutter build apk --dart-define=SOCKET_URL=https://your-api.com`
  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// Default Map Coordinates: VELS University Campus (Pallavaram, Chennai)
  static const double defaultLat = 12.964742;
  static const double defaultLng = 80.151757;
  static const double defaultZoom = 14.5;

  /// Approaching threshold in metres to trigger visual/sound notification
  static const double approachingThresholdMetres = 1200.0;

  /// Chat config
  static const int chatMaxLength = 1000;
}
