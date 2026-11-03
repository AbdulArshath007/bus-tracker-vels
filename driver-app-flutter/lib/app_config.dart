/// App-level configuration loaded from --dart-define at build time.
library app_config;

class AppConfig {
  AppConfig._();

  static const String appName = 'VELS Bus Tracker';
  static const String institutionName = 'VELS Institute of Science, Technology & Advanced Studies';
  static const String institutionShort = 'VISTAS';

  /// Base URL for REST API calls.
  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/v1/',
  );

  /// Socket.IO server URL.
  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  /// Default Map Coordinates: VELS University Campus (Pallavaram, Chennai)
  static const double defaultLat = 12.964742;
  static const double defaultLng = 80.151757;
  static const double defaultZoom = 14.5;

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
