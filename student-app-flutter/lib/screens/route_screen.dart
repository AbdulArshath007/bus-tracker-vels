import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_student/models/route_stop.dart';
import 'package:vels_student/providers/student_bus_provider.dart';
import 'package:vels_student/theme/app_theme.dart';

class RouteScreen extends ConsumerStatefulWidget {
  const RouteScreen({super.key});

  @override
  ConsumerState<RouteScreen> createState() => _RouteScreenState();
}

class _RouteScreenState extends ConsumerState<RouteScreen> {
  bool _alarmEnabled = true;

  @override
  Widget build(BuildContext context) {
    final tracking = ref.watch(studentBusProvider);
    final theme = Theme.of(context);
    final stops = tracking.stops;
    final bus = tracking.busLocation;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Route Schedule & Stops',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        children: [
          // ── Summary Card ──────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.cardTheme.color,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: (theme.cardTheme.shape as RoundedRectangleBorder?)?.side.color ??
                    AppTheme.lightBorder,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      bus.routeName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.success.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '${stops.length} Stops',
                        style: const TextStyle(
                          color: AppTheme.success,
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Driver: ${bus.driverName} • ${bus.driverPhone}',
                  style: TextStyle(
                    fontSize: 13,
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(height: 14),

                // Alarm Switcher
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: theme.primaryColor.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _alarmEnabled
                            ? Icons.notifications_active_rounded
                            : Icons.notifications_off_outlined,
                        color: theme.primaryColor,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Approaching Alarm',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              'Notify 10 mins before reaching your stop',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppTheme.lightTextMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: _alarmEnabled,
                        onChanged: (val) {
                          setState(() => _alarmEnabled = val);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                val
                                    ? 'Proximity alarm activated for your boarding stop'
                                    : 'Proximity alarm disabled',
                              ),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ── Timeline Section Header ───────────────────────────────────────
          const Text(
            'STATION TIMELINE',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: AppTheme.lightTextMuted,
            ),
          ),
          const SizedBox(height: 12),

          // ── Vertical Stops Timeline ───────────────────────────────────────
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: stops.length,
            itemBuilder: (context, index) {
              final stop = stops[index];
              final isLast = index == stops.length - 1;

              return _TimelineStopTile(
                stop: stop,
                isLast: isLast,
                theme: theme,
              );
            },
          ),
        ],
      ),
    );
  }
}

class _TimelineStopTile extends StatelessWidget {
  const _TimelineStopTile({
    required this.stop,
    required this.isLast,
    required this.theme,
  });

  final RouteStop stop;
  final bool isLast;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final isStudentStop = stop.isStudentStop;
    final isNext = stop.isNext;
    final isPassed = stop.isPassed;

    Color nodeColor = AppTheme.primary;
    if (isStudentStop) nodeColor = AppTheme.warning;
    if (isNext) nodeColor = AppTheme.success;
    if (isPassed && !isStudentStop) nodeColor = Colors.grey.shade400;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Node & Vertical Connector ─────────────────────────────────────
          SizedBox(
            width: 38,
            child: Column(
              children: [
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: nodeColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: nodeColor.withValues(alpha: 0.35),
                        blurRadius: 6,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                  child: Center(
                    child: isStudentStop
                        ? const Icon(Icons.star_rounded, size: 14, color: Colors.white)
                        : Text(
                            '${stop.sequenceNum}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2.5,
                      color: isPassed
                          ? Colors.grey.shade300
                          : theme.primaryColor.withValues(alpha: 0.3),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 10),

          // ── Stop Details Card ─────────────────────────────────────────────
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isStudentStop
                      ? AppTheme.warning.withValues(alpha: 0.08)
                      : (isNext
                          ? AppTheme.success.withValues(alpha: 0.08)
                          : theme.cardTheme.color),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isStudentStop
                        ? AppTheme.warning.withValues(alpha: 0.5)
                        : (isNext
                            ? AppTheme.success.withValues(alpha: 0.5)
                            : (theme.cardTheme.shape as RoundedRectangleBorder?)
                                    ?.side
                                    .color ??
                                AppTheme.lightBorder),
                    width: isStudentStop || isNext ? 1.5 : 1,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            stop.stopName,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: isPassed && !isStudentStop
                                  ? theme.colorScheme.onSurface.withValues(alpha: 0.6)
                                  : null,
                            ),
                          ),
                        ),
                        Text(
                          stop.scheduledTime,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isNext ? AppTheme.success : AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                    if (stop.stopNameTa != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        stop.stopNameTa!,
                        style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onSurface.withValues(alpha: 0.55),
                        ),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        if (isStudentStop)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.warning.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              '★ Your Boarding Stop',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.warning,
                              ),
                            ),
                          ),
                        if (isNext)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.success.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'BUS ARRIVING NEXT',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.success,
                              ),
                            ),
                          ),
                        if (isPassed && !isStudentStop && !isNext)
                          Text(
                            'Passed',
                            style: TextStyle(
                              fontSize: 11,
                              color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
