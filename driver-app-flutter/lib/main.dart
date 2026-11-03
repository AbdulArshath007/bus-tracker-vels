import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:vels_driver/providers/session_provider.dart';
import 'package:vels_driver/providers/theme_provider.dart';
import 'package:vels_driver/screens/chat_screen.dart';
import 'package:vels_driver/screens/home_screen.dart';
import 'package:vels_driver/screens/login_screen.dart';
import 'package:vels_driver/screens/settings_screen.dart';
import 'package:vels_driver/screens/student_home_screen.dart';
import 'package:vels_driver/screens/student_route_screen.dart';
import 'package:vels_driver/screens/student_settings_screen.dart';
import 'package:vels_driver/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Transparent status bar for immersive look
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const ProviderScope(child: VelsBusTrackerApp()));
}

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) async {
      final authState = ref.read(authProvider);

      if (authState is AuthInitial) return null;

      final isAuthenticated = authState is AuthAuthenticated;
      final isOnLogin = state.uri.toString() == '/login';

      if (!isAuthenticated && !isOnLogin) return '/login';
      if (isAuthenticated && isOnLogin) {
        final isStudent = authState.user.isStudent;
        return isStudent ? '/student-home' : '/home';
      }

      if (isAuthenticated) {
        final isStudent = authState.user.isStudent;
        final loc = state.uri.toString();
        // Prevent student from accessing driver home directly
        if (isStudent && (loc == '/home' || loc == '/settings')) {
          return '/student-home';
        }
        // Prevent driver from accessing student home directly
        if (!isStudent && (loc == '/student-home' || loc == '/student-route' || loc == '/student-settings')) {
          return '/home';
        }
      }

      return null;
    },
    refreshListenable: _AuthStateListenable(ref),
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),

      // ─── Driver Navigation Shell ──────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => _DriverShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (_, __) => const HomeScreen(),
          ),
          GoRoute(
            path: '/chat',
            builder: (_, __) => const ChatScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (_, __) => const SettingsScreen(),
          ),
        ],
      ),

      // ─── Student Navigation Shell ──────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => _StudentShell(child: child),
        routes: [
          GoRoute(
            path: '/student-home',
            builder: (_, __) => const StudentHomeScreen(),
          ),
          GoRoute(
            path: '/student-route',
            builder: (_, __) => const StudentRouteScreen(),
          ),
          GoRoute(
            path: '/student-chat',
            builder: (_, __) => const ChatScreen(),
          ),
          GoRoute(
            path: '/student-settings',
            builder: (_, __) => const StudentSettingsScreen(),
          ),
        ],
      ),
    ],
  );
});

class VelsBusTrackerApp extends ConsumerWidget {
  const VelsBusTrackerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeProvider);

    return MaterialApp.router(
      title: 'VELS Bus Tracker',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}

/// Makes GoRouter react to auth state changes safely.
class _AuthStateListenable extends ChangeNotifier {
  _AuthStateListenable(Ref ref) {
    ref.listen<AuthState>(authProvider, (_, __) {
      Future.microtask(() => notifyListeners());
    });
  }
}

/// Bottom-navigation shell for Driver (Map, Chat, Settings)
class _DriverShell extends StatelessWidget {
  const _DriverShell({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();

    int currentIndex = 0;
    if (location.startsWith('/chat')) currentIndex = 1;
    if (location.startsWith('/settings')) currentIndex = 2;

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: currentIndex,
        onTap: (i) {
          if (i == 0) context.go('/home');
          if (i == 1) context.go('/chat');
          if (i == 2) context.go('/settings');
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.location_on_outlined),
            activeIcon: Icon(Icons.location_on),
            label: 'Driver Map',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline_rounded),
            activeIcon: Icon(Icons.chat_bubble_rounded),
            label: 'Chat',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}

/// Bottom-navigation shell for Student (Track, Schedule, Chat, Profile)
class _StudentShell extends StatelessWidget {
  const _StudentShell({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();

    int currentIndex = 0;
    if (location.startsWith('/student-route')) currentIndex = 1;
    if (location.startsWith('/student-chat')) currentIndex = 2;
    if (location.startsWith('/student-settings')) currentIndex = 3;

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: currentIndex,
        onTap: (i) {
          if (i == 0) context.go('/student-home');
          if (i == 1) context.go('/student-route');
          if (i == 2) context.go('/student-chat');
          if (i == 3) context.go('/student-settings');
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.location_on_outlined),
            activeIcon: Icon(Icons.location_on_rounded),
            label: 'Track',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.alt_route_rounded),
            activeIcon: Icon(Icons.alt_route_rounded),
            label: 'Schedule',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline_rounded),
            activeIcon: Icon(Icons.chat_bubble_rounded),
            label: 'Route Chat',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline_rounded),
            activeIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
