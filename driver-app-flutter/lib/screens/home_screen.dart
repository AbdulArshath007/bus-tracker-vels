import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:vels_driver/providers/ride_provider.dart';
import 'package:vels_driver/providers/session_provider.dart';
import 'package:vels_driver/widgets/ride_status_card.dart';
import 'package:vels_driver/widgets/swipe_button.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:vels_driver/providers/location_provider.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:vels_driver/screens/settings_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    _requestPermissions();
  }

  Future<void> _requestPermissions() async {
    final statuses = await [
      Permission.location,
      Permission.locationWhenInUse,
      Permission.notification,
    ].request();

    if (statuses[Permission.locationWhenInUse] == PermissionStatus.granted) {
      await Permission.locationAlways.request();
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.error_outline,
                color: Theme.of(context).colorScheme.error),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final rideState = ref.watch(rideProvider);
    final authState = ref.watch(authProvider);
    final theme = Theme.of(context);

    ref.listen<RideState>(rideProvider, (_, next) {
      if (next is RideError) _showError(next.message);
    });

    final user =
        authState is AuthAuthenticated ? authState.user : null;
    final driverName = user?.name ?? 'Driver';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Dashboard',
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.w700)),
            Text(
              'Hello, $driverName',
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withValues(alpha: 0.8),
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
      ),

      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              const SizedBox(height: 20),
              RideStatusCard(rideState: rideState),
              const SizedBox(height: 16),
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4)),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Consumer(
                      builder: (context, ref, child) {
                        final locationAsync = ref.watch(locationProvider);

                        return locationAsync.when(
                          data: (position) => FlutterMap(
                            options: MapOptions(
                              initialCenter: LatLng(
                                  position.latitude, position.longitude),
                              initialZoom: 16.0,
                            ),
                            children: [
                              TileLayer(
                                urlTemplate:
                                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                userAgentPackageName:
                                    'com.vels.bustracker.driver',
                              ),
                              MarkerLayer(
                                markers: [
                                  Marker(
                                    point: LatLng(position.latitude,
                                        position.longitude),
                                    width: 40,
                                    height: 40,
                                    child: Icon(
                                        Icons.directions_bus_rounded,
                                        color: theme.primaryColor,
                                        size: 40),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          loading: () => Skeletonizer(
                            enabled: true,
                            child:
                                Container(color: Colors.grey.shade300),
                          ),
                          error: (err, stack) => const Center(
                              child: Text('Failed to load map')),
                        );
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              _buildPrimaryAction(rideState, theme),
              const SizedBox(height: 16),
              Text(
                'VELS Driver Module',
                style: TextStyle(
                  fontSize: 12,
                  color: theme.textTheme.bodyMedium?.color
                      ?.withValues(alpha: 0.4),
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPrimaryAction(RideState rideState, ThemeData theme) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      child: switch (rideState) {
        RideLoading() => SizedBox(
            key: const ValueKey('loading'),
            height: 80,
            child: Center(
              child: CircularProgressIndicator(color: theme.primaryColor),
            ),
          ),
        RideIdle() => Padding(
            key: const ValueKey('idle'),
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                Text(
                  'Ready to start',
                  style: TextStyle(
                    fontSize: 14,
                    color: theme.textTheme.bodyMedium?.color
                        ?.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(height: 12),
                SwipeButton(
                  label: 'Swipe to Start',
                  thumbColor: theme.primaryColor,
                  onSwipeComplete: () =>
                      ref.read(rideProvider.notifier).startRide(),
                ),
              ],
            ),
          ),
        RideActive() => Padding(
            key: const ValueKey('active'),
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                Text(
                  'Route in progress',
                  style: TextStyle(
                    fontSize: 14,
                    color: theme.textTheme.bodyMedium?.color
                        ?.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(height: 12),
                SwipeButton(
                  label: 'Swipe to End Ride',
                  thumbColor: theme.colorScheme.error,
                  icon: Icons.stop_rounded,
                  onSwipeComplete: () =>
                      ref.read(rideProvider.notifier).endRide(),
                ),
              ],
            ),
          ),
        RideDestinationReached() => Padding(
            key: const ValueKey('dest'),
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: theme.primaryColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(
                        color:
                            theme.primaryColor.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle_rounded,
                          color: theme.primaryColor, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'Destination Reached',
                        style: TextStyle(
                          color: theme.primaryColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                SwipeButton(
                  label: 'Swipe to End Ride',
                  thumbColor: theme.colorScheme.error,
                  icon: Icons.stop_rounded,
                  onSwipeComplete: () =>
                      ref.read(rideProvider.notifier).endRide(),
                ),
              ],
            ),
          ),
        RideError() => const SizedBox.shrink(key: ValueKey('error')),
      },
    );
  }
}
