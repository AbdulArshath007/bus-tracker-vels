import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_driver/core/socket_manager.dart';
import 'package:vels_driver/providers/ride_provider.dart';

class ConnectionBadge extends ConsumerWidget {
  const ConnectionBadge({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusAsync = ref.watch(connectionStatusProvider);

    return statusAsync.when(
      data: (status) => _Badge(status: status),
      loading: () => const _Badge(status: SocketConnectionStatus.connecting),
      error: (_, __) => const _Badge(status: SocketConnectionStatus.error),
    );
  }
}

class _Badge extends StatefulWidget {
  const _Badge({required this.status});
  final SocketConnectionStatus status;

  @override
  State<_Badge> createState() => _BadgeState();
}

class _BadgeState extends State<_Badge> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (color, label) = switch (widget.status) {
      SocketConnectionStatus.connected => (theme.primaryColor, 'Streaming'),
      SocketConnectionStatus.connecting => (theme.primaryColor.withValues(alpha: 0.7), 'Connecting…'),
      SocketConnectionStatus.reconnecting => (theme.primaryColor.withValues(alpha: 0.7), 'Reconnecting…'),
      SocketConnectionStatus.error => (theme.colorScheme.error, 'Error'),
      SocketConnectionStatus.disconnected => (theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.4) ?? Colors.grey, 'Disconnected'),
    };

    final isActive = widget.status == SocketConnectionStatus.connected;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (_, __) => Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: color.withOpacity(
                  isActive ? _pulseAnimation.value : 0.8,
                ),
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
