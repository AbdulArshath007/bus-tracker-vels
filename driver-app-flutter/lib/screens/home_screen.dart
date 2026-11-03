import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:vels_driver/app_config.dart';
import 'package:vels_driver/providers/ride_provider.dart';
import 'package:vels_driver/providers/session_provider.dart';
import 'package:vels_driver/widgets/ride_status_card.dart';
import 'package:vels_driver/widgets/swipe_button.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:vels_driver/providers/location_provider.dart';
import 'package:vels_driver/theme/app_theme.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final MapController _mapController = MapController();

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
    final isRideActive = rideState is RideActive;

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
                        final currentPos = locationAsync.valueOrNull ?? createMockPosition();
                        final latLng = LatLng(currentPos.latitude, currentPos.longitude);

                        return Stack(
                          children: [
                            FlutterMap(
                              mapController: _mapController,
                              options: MapOptions(
                                initialCenter: isRideActive
                                    ? latLng
                                    : const LatLng(AppConfig.defaultLat, AppConfig.defaultLng),
                                initialZoom: 15.5,
                              ),
                              children: [
                                TileLayer(
                                  urlTemplate:
                                      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                  userAgentPackageName:
                                      'com.vels.bustracker.driver',
                                ),
                                // ONLY show device location pin AFTER Swipe to Start
                                if (isRideActive)
                                  MarkerLayer(
                                    markers: [
                                      Marker(
                                        point: latLng,
                                        width: 56,
                                        height: 56,
                                        child: Stack(
                                          alignment: Alignment.center,
                                          children: [
                                            // Radar pulse halo
                                            Container(
                                              width: 56,
                                              height: 56,
                                              decoration: BoxDecoration(
                                                shape: BoxShape.circle,
                                                color: theme.primaryColor.withValues(alpha: 0.25),
                                              ),
                                            ),
                                            Container(
                                              width: 42,
                                              height: 42,
                                              decoration: BoxDecoration(
                                                color: theme.primaryColor,
                                                shape: BoxShape.circle,
                                                border: Border.all(color: Colors.white, width: 2.5),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Colors.black.withValues(alpha: 0.25),
                                                    blurRadius: 6,
                                                  ),
                                                ],
                                              ),
                                              child: const Center(
                                                child: Icon(
                                                  Icons.directions_bus_rounded,
                                                  color: Colors.white,
                                                  size: 24,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                              ],
                            ),

                            // Status Overlay Banner at top of map
                            Positioned(
                              top: 12,
                              left: 12,
                              right: 12,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.95),
                                  borderRadius: BorderRadius.circular(24),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.1),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                  border: Border.all(color: AppTheme.border),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: isRideActive ? AppTheme.success : AppTheme.warning,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        isRideActive
                                            ? 'Live Device GPS: ${latLng.latitude.toStringAsFixed(4)}, ${latLng.longitude.toStringAsFixed(4)}'
                                            : 'Location Hidden • Swipe below to start ride',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: isRideActive ? AppTheme.textPrimary : AppTheme.textSecondary,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (isRideActive)
                                      IconButton(
                                        icon: const Icon(Icons.my_location, size: 18, color: AppTheme.primary),
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                        onPressed: () => _mapController.move(latLng, 16.0),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ],
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
                const Text(
                  'Destination Reached!',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.success,
                  ),
                ),
                const SizedBox(height: 12),
                SwipeButton(
                  label: 'Swipe to Complete',
                  thumbColor: AppTheme.success,
                  icon: Icons.check_circle_rounded,
                  onSwipeComplete: () =>
                      ref.read(rideProvider.notifier).endRide(),
                ),
              ],
            ),
          ),
        _ => const SizedBox.shrink(),
      },
    );
  }
}
