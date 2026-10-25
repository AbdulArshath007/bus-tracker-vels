import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_student/providers/session_provider.dart';
import 'package:vels_student/providers/theme_provider.dart';
import 'package:vels_student/theme/app_theme.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final themeMode = ref.watch(themeProvider);

    final isDark = themeMode == ThemeMode.dark ||
        (themeMode == ThemeMode.system &&
            MediaQuery.of(context).platformBrightness == Brightness.dark);

    final user = authState is AuthAuthenticated ? authState.user : null;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Settings & Profile',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        children: [
          // ── Profile Section ──────────────────────────────────────────────
          const _SectionLabel(label: 'STUDENT PROFILE'),
          const SizedBox(height: 8),

          _SettingsCard(
            icon: Icons.person_outline_rounded,
            title: 'Full Name',
            subtitle: user?.name ?? 'Student',
            onTap: () => _showEditDialog(
              context: context,
              title: 'Change Name',
              label: 'Full Name',
              initial: user?.name ?? '',
              onSave: (val) => ref.read(authProvider.notifier).updateProfile(name: val),
            ),
          ),
          const SizedBox(height: 10),

          _SettingsCard(
            icon: Icons.badge_outlined,
            title: 'Register Number',
            subtitle: user?.registerNumber ?? '2024VELS1089',
          ),
          const SizedBox(height: 10),

          _SettingsCard(
            icon: Icons.school_outlined,
            title: 'Department',
            subtitle: user?.department ?? 'Engineering & Technology',
          ),
          const SizedBox(height: 10),

          _SettingsCard(
            icon: Icons.pin_drop_outlined,
            title: 'Designated Boarding Stop',
            subtitle: user?.boardingStopName ?? 'Tambaram Sanatorium',
            onTap: () => _showEditDialog(
              context: context,
              title: 'Change Boarding Stop',
              label: 'Boarding Stop',
              initial: user?.boardingStopName ?? '',
              onSave: (val) =>
                  ref.read(authProvider.notifier).updateProfile(boardingStopName: val),
            ),
          ),
          const SizedBox(height: 10),

          _SettingsCard(
            icon: Icons.phone_outlined,
            title: 'Contact Phone',
            subtitle: user?.phone ?? '+91 98401 23456',
            onTap: () => _showEditDialog(
              context: context,
              title: 'Update Phone',
              label: 'Mobile Number',
              initial: user?.phone ?? '',
              keyboardType: TextInputType.phone,
              onSave: (val) =>
                  ref.read(authProvider.notifier).updateProfile(phone: val),
            ),
          ),
          const SizedBox(height: 24),

          // ── Preferences Section ──────────────────────────────────────────
          const _SectionLabel(label: 'PREFERENCES'),
          const SizedBox(height: 8),

          _SettingsCard(
            icon: isDark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
            title: 'Appearance / Dark Mode',
            subtitle: isDark ? 'Dark Mode (Activated)' : 'Light Mode (Standard)',
            trailing: Switch(
              value: isDark,
              onChanged: (_) => ref.read(themeProvider.notifier).toggleTheme(),
            ),
          ),
          const SizedBox(height: 10),

          _SettingsCard(
            icon: Icons.translate_rounded,
            title: 'Language / மொழி',
            subtitle: user?.languagePref == 'ta' ? 'தமிழ் (Tamil)' : 'English',
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => _showLanguageSheet(context, ref, user?.languagePref ?? 'en'),
          ),
          const SizedBox(height: 24),

          // ── University Transport Helpline ────────────────────────────────
          const _SectionLabel(label: 'CAMPUS TRANSPORT HELPLINE'),
          const SizedBox(height: 8),

          _SettingsCard(
            icon: Icons.support_agent_rounded,
            title: 'VISTAS Transport Office',
            subtitle: '+91 44 2266 2500 / Ext 142',
            trailing: const Icon(Icons.call_outlined, color: AppTheme.success),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Calling VISTAS Transport Desk...'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
          const SizedBox(height: 10),

          _SettingsCard(
            icon: Icons.local_police_outlined,
            title: 'Campus Security & Emergency',
            subtitle: '+91 44 2266 2511 (24x7)',
            trailing: const Icon(Icons.call_outlined, color: AppTheme.danger),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Calling Campus Emergency Desk...'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
          const SizedBox(height: 28),

          // ── Logout Button ────────────────────────────────────────────────
          OutlinedButton.icon(
            onPressed: () => _confirmLogout(context, ref),
            icon: const Icon(Icons.logout_rounded, color: AppTheme.danger),
            label: const Text(
              'Log Out',
              style: TextStyle(
                color: AppTheme.danger,
                fontWeight: FontWeight.w700,
              ),
            ),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: AppTheme.danger),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
          const SizedBox(height: 20),

          Center(
            child: Text(
              'VELS Student App v1.0.0\nVELS Institute of Science, Technology & Advanced Studies',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showEditDialog({
    required BuildContext context,
    required String title,
    required String label,
    required String initial,
    required ValueChanged<String> onSave,
    TextInputType keyboardType = TextInputType.text,
  }) {
    final controller = TextEditingController(text: initial);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        content: TextField(
          controller: controller,
          keyboardType: keyboardType,
          autofocus: true,
          decoration: InputDecoration(labelText: label),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final val = controller.text.trim();
              if (val.isNotEmpty) {
                onSave(val);
                Navigator.pop(ctx);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showLanguageSheet(BuildContext context, WidgetRef ref, String current) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select Language / மொழி தேர்வு',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
            ListTile(
              title: const Text('English'),
              trailing: current == 'en'
                  ? const Icon(Icons.check_circle_rounded, color: AppTheme.primary)
                  : null,
              onTap: () {
                ref.read(authProvider.notifier).updateProfile(languagePref: 'en');
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              title: const Text('தமிழ் (Tamil)'),
              trailing: current == 'ta'
                  ? const Icon(Icons.check_circle_rounded, color: AppTheme.primary)
                  : null,
              onTap: () {
                ref.read(authProvider.notifier).updateProfile(languagePref: 'ta');
                Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text(
          'Are you sure you want to log out of VELS Student Bus Tracker?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.0,
        color: AppTheme.lightTextMuted,
      ),
    );
  }
}

class _SettingsCard extends StatelessWidget {
  const _SettingsCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: theme.cardTheme.color,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: (theme.cardTheme.shape as RoundedRectangleBorder?)?.side.color ??
                AppTheme.lightBorder,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: theme.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 20, color: theme.primaryColor),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
            ),
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}
