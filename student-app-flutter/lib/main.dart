import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:vels_student/providers/session_provider.dart';
import 'package:vels_student/providers/theme_provider.dart';
import 'package:vels_student/screens/chat_screen.dart';
import 'package:vels_student/screens/home_screen.dart';
import 'package:vels_student/screens/login_screen.dart';
import 'package:vels_student/screens/route_screen.dart';
import 'package:vels_student/screens/settings_screen.dart';
import 'package:vels_student/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait for consistent mobile UX
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Transparent status bar for immersive map view
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const ProviderScope(child: VelsStudentApp()));
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
      if (isAuthenticated && isOnLogin) return '/home';
      return null;
    },
    refreshListenable: _AuthStateListenable(ref),
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => _MainShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (_, __) => const HomeScreen(),
          ),
          GoRoute(
            path: '/route',
            builder: (_, __) => const RouteScreen(),
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
    ],
  );
});

class VelsStudentApp extends ConsumerWidget {
  const VelsStudentApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeProvider);

    return MaterialApp.router(
      title: 'VELS Student Bus Tracker',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}

class _AuthStateListenable extends ChangeNotifier {
  _AuthStateListenable(Ref ref) {
    ref.listen<AuthState>(authProvider, (_, __) {
      Future.microtask(() => notifyListeners());
    });
  }
}

class _MainShell extends StatelessWidget {
  const _MainShell({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();

    int currentIndex = 0;
    if (location.startsWith('/route')) currentIndex = 1;
    if (location.startsWith('/chat')) currentIndex = 2;
    if (location.startsWith('/settings')) currentIndex = 3;

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: currentIndex,
        onTap: (i) {
          if (i == 0) context.go('/home');
          if (i == 1) context.go('/route');
          if (i == 2) context.go('/chat');
          if (i == 3) context.go('/settings');
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
