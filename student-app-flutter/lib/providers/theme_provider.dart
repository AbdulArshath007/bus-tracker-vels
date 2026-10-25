import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kThemeKey = 'student_theme_mode';

class ThemeNotifier extends StateNotifier<ThemeMode> {
  ThemeNotifier() : super(ThemeMode.system) {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final val = prefs.getString(_kThemeKey);
    if (val == 'light') {
      state = ThemeMode.light;
    } else if (val == 'dark') {
      state = ThemeMode.dark;
    } else {
      state = ThemeMode.system;
    }
  }

  Future<void> setTheme(ThemeMode mode) async {
    state = mode;
    final prefs = await SharedPreferences.getInstance();
    if (mode == ThemeMode.light) {
      await prefs.setString(_kThemeKey, 'light');
    } else if (mode == ThemeMode.dark) {
      await prefs.setString(_kThemeKey, 'dark');
    } else {
      await prefs.remove(_kThemeKey);
    }
  }

  void toggleTheme() {
    if (state == ThemeMode.light) {
      setTheme(ThemeMode.dark);
    } else {
      setTheme(ThemeMode.light);
    }
  }
}

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>(
  (ref) => ThemeNotifier(),
);
