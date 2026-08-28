# Flutter-specific ProGuard rules for the Vels Driver app

# ─── Flutter / Dart ────────────────────────────────────────────────────────
-keep class io.flutter.** { *; }
-keep class io.flutter.embedding.** { *; }

# ─── Socket.IO client ──────────────────────────────────────────────────────
-keep class io.socket.** { *; }
-keep class com.github.nkzawa.** { *; }
-dontwarn io.socket.**

# ─── OkHttp (used internally by socket.io) ────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ─── Geolocator ────────────────────────────────────────────────────────────
-keep class com.baseflow.geolocator.** { *; }

# ─── Flutter Foreground Task ───────────────────────────────────────────────
-keep class com.pravera.flutter_foreground_task.** { *; }

# ─── Flutter Secure Storage ───────────────────────────────────────────────
-keep class com.it_nomads.fluttersecurestorage.** { *; }

# ─── Keep JSON model class names (prevent Dart ↔ JSON field name mangling) ─
-keepattributes Signature
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# ─── Remove logging in release ─────────────────────────────────────────────
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
