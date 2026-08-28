import 'dart:async';
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

  Future<void> login({required String email, required String password}) async {
    state = const AuthLoading();
    try {
      await _authService.login(email: email, password: password);
      final user = await _session.getUser();
      state = user != null
          ? AuthAuthenticated(user)
          : const AuthError('Login succeeded but user profile was not received.');
    } on AuthException catch (e) {
      state = AuthError(e.message);
    } catch (e) {
      state = AuthError('Unexpected error: $e');
    }
  }

  Future<void> guestLogin() async {
    state = const AuthLoading();
    try {
      await _authService.guestLogin();
      final user = await _session.getUser();
      state = user != null
          ? AuthAuthenticated(user)
          : const AuthError('Guest login succeeded but user profile was not received.');
    } on AuthException catch (e) {
      state = AuthError(e.message);
    } catch (e) {
      state = AuthError('Unexpected error: $e');
    }
  }

  Future<void> updateProfile({
    String? name,
    String? email,
    String? phone,
  }) async {
    try {
      final updated = await _authService.updateProfile(
        name: name,
        email: email,
        phone: phone,
      );
      state = AuthAuthenticated(updated);
    } on AuthException catch (e) {
      throw e;
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
