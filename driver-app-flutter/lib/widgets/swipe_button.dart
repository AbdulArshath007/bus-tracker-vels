import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:vels_driver/app_config.dart';
import 'package:vels_driver/theme/app_theme.dart';

/// An animated swipe-to-confirm button.
///
/// The user must drag the thumb more than [AppConfig.swipeThreshold] of the
/// track width to trigger [onSwipeComplete].  If released early, the thumb
/// snaps back with a spring animation.
class SwipeButton extends StatefulWidget {
  const SwipeButton({
    super.key,
    required this.label,
    required this.onSwipeComplete,
    this.trackColor,
    this.thumbColor,
    this.icon = Icons.double_arrow_rounded,
  });

  final String label;
  final VoidCallback onSwipeComplete;
  final Color? trackColor;
  final Color? thumbColor;
  final IconData icon;

  @override
  State<SwipeButton> createState() => _SwipeButtonState();
}

class _SwipeButtonState extends State<SwipeButton>
    with SingleTickerProviderStateMixin {
  double _dragFraction = 0.0; // 0..1
  bool _completed = false;

  late AnimationController _snapController;
  late Animation<double> _snapAnimation;

  @override
  void initState() {
    super.initState();
    _snapController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
  }

  @override
  void dispose() {
    _snapController.dispose();
    super.dispose();
  }

  void _onDragUpdate(DragUpdateDetails details, double maxOffset) {
    if (_completed) return;
    setState(() {
      _dragFraction =
          (_dragFraction + details.delta.dx / maxOffset).clamp(0.0, 1.0);
    });
  }

  void _onDragEnd(DragEndDetails _, double maxOffset) {
    if (_completed) return;
    if (_dragFraction >= AppConfig.swipeThreshold) {
      setState(() {
        _dragFraction = 1.0;
        _completed = true;
      });
      widget.onSwipeComplete();
      // Snap back after a short delay to reset for next time
      Future.delayed(const Duration(milliseconds: 800), () {
        if (mounted) {
          _animateBack();
        }
      });
    } else {
      _animateBack();
    }
  }

  void _animateBack() {
    _snapAnimation = Tween<double>(begin: _dragFraction, end: 0.0).animate(
      CurvedAnimation(parent: _snapController, curve: Curves.elasticOut),
    )..addListener(() {
        setState(() => _dragFraction = _snapAnimation.value);
      });
    _snapController.forward(from: 0).then((_) {
      _completed = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    const thumbSize = 56.0;
    const trackHeight = 64.0;
    const horizontalPad = 4.0;

    final theme = Theme.of(context);
    final trackColor =
        widget.trackColor ?? theme.primaryColor.withValues(alpha: 0.15);
    final thumbColor = widget.thumbColor ?? theme.primaryColor;

    return LayoutBuilder(
      builder: (context, constraints) {
        final trackWidth = math.min(constraints.maxWidth, 320.0);
        final maxOffset = trackWidth - thumbSize - horizontalPad * 2;
        final thumbOffset = _dragFraction * maxOffset;
        final labelOpacity = (1.0 - _dragFraction * 2).clamp(0.0, 1.0);

        return SizedBox(
          width: trackWidth,
          height: trackHeight,
          child: Stack(
            children: [
              // ── Track ──────────────────────────────────────────
              Container(
                width: trackWidth,
                height: trackHeight,
                decoration: BoxDecoration(
                  color: trackColor,
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(
                    color: thumbColor.withValues(alpha: 0.3),
                    width: 1.5,
                  ),
                ),
                alignment: Alignment.center,
                child: Opacity(
                  opacity: labelOpacity,
                  child: Text(
                    widget.label,
                    style: TextStyle(
                      color: thumbColor,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),

              // ── Filled progress ────────────────────────────────
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                child: Container(
                  width: thumbOffset + thumbSize / 2 + horizontalPad,
                  decoration: BoxDecoration(
                    color: thumbColor.withValues(alpha: 0.08),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(32),
                      bottomLeft: Radius.circular(32),
                    ),
                  ),
                ),
              ),

              // ── Thumb ──────────────────────────────────────────
              Positioned(
                left: thumbOffset + horizontalPad,
                top: (trackHeight - thumbSize) / 2,
                child: GestureDetector(
                  onHorizontalDragUpdate: (d) =>
                      _onDragUpdate(d, maxOffset),
                  onHorizontalDragEnd: (d) => _onDragEnd(d, maxOffset),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 100),
                    width: thumbSize,
                    height: thumbSize,
                    decoration: BoxDecoration(
                      color: thumbColor,
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: thumbColor.withValues(alpha: 0.45),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(
                      widget.icon,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
