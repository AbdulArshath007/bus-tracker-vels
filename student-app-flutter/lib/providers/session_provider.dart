import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_student/core/session_manager.dart';
import 'package:vels_student/models/user_profile.dart';
import 'package:vels_student/services/auth_service.dart';

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
  AuthNotifier(this._auth, this._session) : super(const AuthInitial()) {
    _checkInitialSession();
  }

  final AuthService _auth;
  final SessionManager _session;

  Future<void> _checkInitialSession() async {
    try {
      final user = await _session.getUser();
      if (user != null) {
        state = AuthAuthenticated(user);
      } else {
        state = const AuthUnauthenticated();
      }
    } catch (_) {
      state = const AuthUnauthenticated();
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = const AuthLoading();
    try {
      final user = await _auth.login(email: email, password: password);
      state = AuthAuthenticated(user);
    } on AuthException catch (e) {
      state = AuthError(e.message);
    } catch (e) {
      state = AuthError('Login failed: ${e.toString()}');
    }
  }

  Future<void> loginAsGuest() async {
    state = const AuthLoading();
    try {
      final user = await _auth.loginAsGuest();
      state = AuthAuthenticated(user);
    } catch (e) {
      state = AuthError('Demo login failed: ${e.toString()}');
    }
  }

  Future<void> updateProfile({
    String? name,
    String? phone,
    String? boardingStopName,
    String? themePref,
    String? languagePref,
  }) async {
    try {
      final updated = await _auth.updateProfile(
        name: name,
        phone: phone,
        boardingStopName: boardingStopName,
        themePref: themePref,
        languagePref: languagePref,
      );
      state = AuthAuthenticated(updated);
    } catch (e) {
      // Keep existing state
    }
  }

  Future<void> logout() async {
    await _auth.logout();
    state = const AuthUnauthenticated();
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(
    ref.read(authServiceProvider),
    ref.read(sessionManagerProvider),
  ),
);
