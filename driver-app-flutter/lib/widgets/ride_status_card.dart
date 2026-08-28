import 'package:flutter/material.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:vels_driver/providers/ride_provider.dart';
import 'package:vels_driver/widgets/connection_badge.dart';

class RideStatusCard extends StatelessWidget {
  const RideStatusCard({super.key, required this.rideState});

  final RideState rideState;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    final isLoading = rideState is RideLoading;
    
    final (icon, title, subtitle, accentColor) = switch (rideState) {
      RideIdle() || RideLoading() => (
          Icons.hail_rounded,
          'Ready to Go',
          'Swipe below to start your route',
          theme.primaryColor,
        ),
      RideActive(:final ride) => (
          Icons.directions_bus_rounded,
          'Ride Active',
          'Bus ${ride.busId}',
          theme.primaryColor,
        ),
      RideDestinationReached(:final ride) => (
          Icons.flag_rounded,
          'Destination Reached',
          'Bus ${ride.busId} — swipe to end',
          theme.primaryColor,
        ),
      RideError(:final message) => (
          Icons.error_outline_rounded,
          'Error',
          message,
          theme.colorScheme.error,
        ),
    };

    return Skeletonizer(
      enabled: isLoading,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: accentColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Icon(icon, color: accentColor, size: 28),
                  ),
                  const ConnectionBadge(),
                ],
              ),
              const SizedBox(height: 20),
              Text(
                title,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: theme.textTheme.bodyMedium?.color,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 14,
                  color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.6),
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 20),
              Container(
                height: 2,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [accentColor.withValues(alpha: 0.5), accentColor.withValues(alpha: 0.0)],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
