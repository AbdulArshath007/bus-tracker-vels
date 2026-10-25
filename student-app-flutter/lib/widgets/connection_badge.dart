import 'package:flutter/material.dart';
import 'package:vels_student/core/socket_manager.dart';

class ConnectionBadge extends StatefulWidget {
  const ConnectionBadge({super.key});

  @override
  State<ConnectionBadge> createState() => _ConnectionBadgeState();
}

class _ConnectionBadgeState extends State<ConnectionBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.4, end: 1.0).animate(
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
    return StreamBuilder<SocketConnectionStatus>(
      stream: SocketManager.instance.statusStream,
      initialData: SocketManager.instance.status,
      builder: (context, snapshot) {
        final status = snapshot.data ?? SocketConnectionStatus.disconnected;

        final Color color;
        final String label;
        final bool isActive;

        switch (status) {
          case SocketConnectionStatus.connected:
            color = const Color(0xFF10B981); // Success Emerald
            label = 'LIVE';
            isActive = true;
          case SocketConnectionStatus.connecting:
          case SocketConnectionStatus.reconnecting:
            color = const Color(0xFFF59E0B); // Amber Warning
            label = 'SYNCING';
            isActive = false;
          case SocketConnectionStatus.disconnected:
          case SocketConnectionStatus.error:
            color = const Color(0xFFEF4444); // Red Danger
            label = 'OFFLINE';
            isActive = false;
        }

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: color.withValues(alpha: 0.4)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, _) => Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color.withValues(
                      alpha: isActive ? _pulseAnimation.value : 0.8,
                    ),
                    boxShadow: isActive
                        ? [
                            BoxShadow(
                              color: color.withValues(alpha: 0.5),
                              blurRadius: 4,
                              spreadRadius: 1,
                            ),
                          ]
                        : null,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
