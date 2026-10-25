import 'package:flutter/material.dart';
import 'package:vels_student/models/bus_location.dart';
import 'package:vels_student/theme/app_theme.dart';
import 'package:vels_student/widgets/connection_badge.dart';

class BusStatusHeroCard extends StatelessWidget {
  const BusStatusHeroCard({
    super.key,
    required this.bus,
    required this.onSwitchBus,
    required this.onCallDriver,
  });

  final BusLocation bus;
  final VoidCallback onSwitchBus;
  final VoidCallback onCallDriver;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isApproaching = bus.status == 'approaching' || bus.distanceKm <= 1.0;

    final primaryColor = isApproaching ? AppTheme.success : theme.primaryColor;

    return Container(
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isApproaching
              ? AppTheme.success.withValues(alpha: 0.6)
              : (theme.cardTheme.shape as RoundedRectangleBorder?)?.side.color ??
                  AppTheme.lightBorder,
          width: isApproaching ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Header: Route, Bus # & Connection Status ──────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: primaryColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.directions_bus_filled_rounded,
                    color: primaryColor,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        bus.busNumber,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        bus.routeName,
                        style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const ConnectionBadge(),
              ],
            ),
          ),

          const Divider(height: 1, thickness: 0.8),

          // ── ETA & Telemetry Metrics ───────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                // ETA Stat
                Expanded(
                  flex: 3,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'ESTIMATED ARRIVAL',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.8,
                          color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            '${bus.etaMinutes}',
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              color: primaryColor,
                              height: 1.0,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'MINS',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: primaryColor,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isApproaching ? 'Approaching your stop!' : 'On schedule',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isApproaching ? AppTheme.success : AppTheme.accent,
                        ),
                      ),
                    ],
                  ),
                ),

                // Vertical Separator
                Container(
                  height: 44,
                  width: 1,
                  color: theme.dividerColor.withValues(alpha: 0.3),
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                ),

                // Distance & Speed
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _MetricRow(
                        icon: Icons.straighten_rounded,
                        label: '${bus.distanceKm} km away',
                        theme: theme,
                      ),
                      const SizedBox(height: 8),
                      _MetricRow(
                        icon: Icons.speed_rounded,
                        label: '${bus.speedKmh.toStringAsFixed(0)} km/h',
                        theme: theme,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Bottom Action Strip: Driver Call & Route Switcher ────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: theme.brightness == Brightness.dark
                  ? Colors.black.withValues(alpha: 0.25)
                  : AppTheme.lightBg,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(15),
                bottomRight: Radius.circular(15),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.near_me_outlined,
                  size: 15,
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Next: ${bus.nextStopName}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.75),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: onCallDriver,
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.success.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.call_rounded, size: 14, color: AppTheme.success),
                        SizedBox(width: 4),
                        Text(
                          'Driver',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.success,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                InkWell(
                  onTap: onSwitchBus,
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: theme.primaryColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.swap_horiz_rounded, size: 14, color: theme.primaryColor),
                        const SizedBox(width: 4),
                        Text(
                          'Routes',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: theme.primaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricRow extends StatelessWidget {
  const _MetricRow({
    required this.icon,
    required this.label,
    required this.theme,
  });

  final IconData icon;
  final String label;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          icon,
          size: 15,
          color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
        ),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
