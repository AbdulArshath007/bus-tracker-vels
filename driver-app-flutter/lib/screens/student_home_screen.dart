import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:vels_driver/app_config.dart';
import 'package:vels_driver/providers/session_provider.dart';
import 'package:vels_driver/providers/student_bus_provider.dart';
import 'package:vels_driver/theme/app_theme.dart';
import 'package:vels_driver/widgets/bus_selector_sheet.dart';
import 'package:vels_driver/widgets/bus_status_hero_card.dart';

class StudentHomeScreen extends ConsumerStatefulWidget {
  const StudentHomeScreen({super.key});

  @override
  ConsumerState<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends ConsumerState<StudentHomeScreen> {
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _requestPermissions();
  }

  Future<void> _requestPermissions() async {
    await [
      Permission.location,
      Permission.locationWhenInUse,
      Permission.notification,
    ].request();
  }

  void _centerOnBus(LatLng pos) {
    _mapController.move(pos, 15.5);
  }

  void _centerOnStudent(LatLng? pos) {
    if (pos == null) return;
    _mapController.move(pos, 15.5);
  }

  void _fitRoute() {
    _mapController.move(
      const LatLng(AppConfig.defaultLat, AppConfig.defaultLng),
      AppConfig.defaultZoom,
    );
  }

  void _openBusSelector() {
    final selectedBusId = ref.read(studentBusProvider).selectedBusId;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BusSelectorSheet(
        selectedBusId: selectedBusId,
        onSelect: (busId) {
          ref.read(studentBusProvider.notifier).selectBus(busId);
        },
      ),
    );
  }

  void _callDriver(String phone, String name) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.phone_in_talk_rounded, color: AppTheme.success),
            const SizedBox(width: 10),
            Text('Call $name'),
          ],
        ),
        content: Text(
          'Connect directly with bus driver $name at $phone for boarding updates?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Simulated call to $phone ($name)'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            icon: const Icon(Icons.call, size: 18),
            label: const Text('Call Now'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final trackingState = ref.watch(studentBusProvider);
    final authState = ref.watch(authProvider);
    final theme = Theme.of(context);

    final user = authState is AuthAuthenticated ? authState.user : null;
    final studentName = user?.name ?? 'Student';
    final bus = trackingState.busLocation;
    final busPos = LatLng(bus.latitude, bus.longitude);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'VELS Bus Tracker',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            Text(
              'Welcome, $studentName • ${user?.assignedBusNumber ?? "Bus #01"}',
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withValues(alpha: 0.85),
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: _openBusSelector,
            icon: const Icon(Icons.alt_route_rounded),
            tooltip: 'Switch Bus Route',
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.white),
            tooltip: 'Logout / Switch Role',
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // ── Map View ──────────────────────────────────────────────────────
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: busPos,
              initialZoom: 14.5,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.vels.bustracker.driver',
              ),

              // Route Polyline Layer
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: trackingState.routePath,
                    strokeWidth: 5.0,
                    color: theme.primaryColor.withValues(alpha: 0.8),
                  ),
                ],
              ),

              // Route Stop Markers Layer
              MarkerLayer(
                markers: [
                  for (final stop in trackingState.stops)
                    Marker(
                      point: LatLng(stop.latitude, stop.longitude),
                      width: 32,
                      height: 32,
                      child: Tooltip(
                        message: '${stop.sequenceNum}. ${stop.stopName} (${stop.scheduledTime})',
                        child: Container(
                          decoration: BoxDecoration(
                            color: stop.isStudentStop
                                ? AppTheme.warning
                                : (stop.isPassed
                                    ? Colors.grey.shade600
                                    : theme.primaryColor),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.2),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                          child: Center(
                            child: stop.isStudentStop
                                ? const Icon(Icons.star_rounded,
                                    size: 16, color: Colors.white)
                                : Text(
                                    '${stop.sequenceNum}',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                          ),
                        ),
                      ),
                    ),

                  // Student Location Marker
                  if (trackingState.studentLocation != null)
                    Marker(
                      point: trackingState.studentLocation!,
                      width: 48,
                      height: 48,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppTheme.accent.withValues(alpha: 0.25),
                            ),
                          ),
                          Container(
                            width: 18,
                            height: 18,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppTheme.accent,
                              border: Border.all(color: Colors.white, width: 2.5),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.3),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Live Bus Marker with Pulse
                  Marker(
                    point: busPos,
                    width: 54,
                    height: 54,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: theme.primaryColor.withValues(alpha: 0.2),
                          ),
                        ),
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: theme.primaryColor,
                            border: Border.all(color: Colors.white, width: 2.5),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.35),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.directions_bus_filled_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),

          // ── Top Floater: Live Bus Status & ETA Card ───────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: BusStatusHeroCard(
                bus: bus,
                onSwitchBus: _openBusSelector,
                onCallDriver: () => _callDriver(bus.driverPhone, bus.driverName),
              ),
            ),
          ),

          // ── Device Location Pill ──────────────────────────────────────────
          Positioned(
            left: 16,
            bottom: 24,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.95),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
                border: Border.all(color: AppTheme.border),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.accent,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    trackingState.studentLocation != null
                        ? 'Device GPS: ${trackingState.studentLocation!.latitude.toStringAsFixed(4)}, ${trackingState.studentLocation!.longitude.toStringAsFixed(4)}'
                        : 'Acquiring Device GPS...',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Map Floating Action Buttons (Recenter) ────────────────────────
          Positioned(
            right: 16,
            bottom: 24,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _MapControlButton(
                  icon: Icons.directions_bus_rounded,
                  tooltip: 'Center on Bus',
                  onTap: () => _centerOnBus(busPos),
                  theme: theme,
                  isHighlight: true,
                ),
                const SizedBox(height: 10),
                _MapControlButton(
                  icon: Icons.my_location_rounded,
                  tooltip: 'My Location',
                  onTap: () => _centerOnStudent(trackingState.studentLocation),
                  theme: theme,
                ),
                const SizedBox(height: 10),
                _MapControlButton(
                  icon: Icons.map_outlined,
                  tooltip: 'Overview Route',
                  onTap: _fitRoute,
                  theme: theme,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MapControlButton extends StatelessWidget {
  const _MapControlButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
    required this.theme,
    this.isHighlight = false,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  final ThemeData theme;
  final bool isHighlight;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isHighlight ? theme.primaryColor : theme.cardTheme.color,
      shape: const CircleBorder(),
      elevation: 4,
      shadowColor: Colors.black.withValues(alpha: 0.3),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Tooltip(
          message: tooltip,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Icon(
              icon,
              size: 22,
              color: isHighlight
                  ? Colors.white
                  : theme.colorScheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}

