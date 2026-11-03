import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_driver/core/api_client.dart';
import 'package:vels_driver/core/session_manager.dart';
import 'package:vels_driver/models/user_profile.dart';
import 'package:vels_driver/services/auth_service.dart';

// ─── Singletons ────────────────────────────────────────────────────────────

final sessionManagerProvider = Provider<SessionManager>(
  (_) => SessionManager.instance,
);

final authServiceProvider = Provider<AuthService>(
  (ref) => AuthService(ref.read(sessionManagerProvider)),
);

// ─── Auth State ────────────────────────────────────────────────────────────

sealed class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.user);
  final UserProfile user;
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  const AuthError(this.message);
  final String message;
}

// ─── Auth Notifier ─────────────────────────────────────────────────────────

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._session, this._authService) : super(const AuthInitial()) {
    _init();
  }

  final SessionManager _session;
  final AuthService _authService;
  StreamSubscription<void>? _expirySub;

  Future<void> _init() async {
    _expirySub = ApiClient.instance.onSessionExpired.listen((_) {
      state = const AuthUnauthenticated();
    });

    final loggedIn = await _session.isLoggedIn();
    if (loggedIn) {
      final user = await _session.getUser();
      if (user != null) {
        state = AuthAuthenticated(user);
      } else {
        state = const AuthUnauthenticated();
      }
    } else {
      state = const AuthUnauthenticated();
    }
  }

  @override
  void dispose() {
    _expirySub?.cancel();
    super.dispose();
  }

  /// Role-based mock login (Driver or Student) with no DB/verification required!
  Future<void> loginWithRole({
    required String role,
    String? email,
    String? password,
  }) async {
    state = const AuthLoading();
    try {
      final user = await _authService.loginWithRole(
        role: role,
        email: email,
        password: password,
      );
      state = AuthAuthenticated(user);
    } catch (e) {
      state = AuthError('Mock login failed: $e');
    }
  }

  Future<void> login({required String email, required String password}) async {
    final role = email.toLowerCase().contains('student') ? 'student' : 'driver';
    await loginWithRole(role: role, email: email, password: password);
  }

  Future<void> guestLogin({String role = 'driver'}) async {
    await loginWithRole(role: role);
  }

  Future<void> updateProfile({
    String? name,
    String? email,
    String? phone,
    String? boardingStopName,
    String? languagePref,
  }) async {
    try {
      final updated = await _authService.updateProfile(
        name: name,
        email: email,
        phone: phone,
        boardingStopName: boardingStopName,
        languagePref: languagePref,
      );
      state = AuthAuthenticated(updated);
    } catch (e) {
      throw AuthException('Failed to update profile: $e');
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = const AuthUnauthenticated();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(
    ref.read(sessionManagerProvider),
    ref.read(authServiceProvider),
  ),
);
