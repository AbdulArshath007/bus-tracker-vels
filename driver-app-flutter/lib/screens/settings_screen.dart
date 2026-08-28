import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_driver/providers/session_provider.dart';
import 'package:vels_driver/providers/theme_provider.dart';
import 'package:vels_driver/services/auth_service.dart';

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
        title: const Text('Settings',
            style: TextStyle(fontWeight: FontWeight.w700)),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Profile ──────────────────────────────────────────────
          const _SectionLabel(label: 'PROFILE'),
          const SizedBox(height: 8),

          _SettingsCard(
            icon: Icons.person_outline,
            title: 'Name',
            subtitle: user?.name ?? '—',
            onTap: () => showDialog<void>(
              context: context,
              barrierDismissible: false,
              builder: (_) => _EditDialog(
                title: 'Change Name',
                label: 'Full name',
                initialValue: user?.name ?? '',
                keyboardType: TextInputType.name,
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? 'Name cannot be empty'
                    : null,
                onSave: (v) => ref
                    .read(authProvider.notifier)
                    .updateProfile(name: v.trim()),
              ),
            ),
          ),
          const SizedBox(height: 10),

          _SettingsCard(
            icon: Icons.mail_outline,
            title: 'Email',
            subtitle: user?.email ?? '—',
            onTap: () => showDialog<void>(
              context: context,
              barrierDismissible: false,
              builder: (_) => _EditDialog(
                title: 'Change Email',
                label: 'Email address',
                initialValue: user?.email ?? '',
                keyboardType: TextInputType.emailAddress,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Email cannot be empty';
                  }
                  final ok = RegExp(
                    r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$',
                  ).hasMatch(v.trim());
                  return ok ? null : 'Enter a valid email';
                },
                onSave: (v) => ref
                    .read(authProvider.notifier)
                    .updateProfile(email: v.trim().toLowerCase()),
              ),
            ),
          ),
          const SizedBox(height: 10),

          _SettingsCard(
            icon: Icons.phone_outlined,
            title: 'Phone',
            subtitle: (user?.phone?.isNotEmpty == true) ? user!.phone! : 'Not set',
            onTap: () => showDialog<void>(
              context: context,
              barrierDismissible: false,
              builder: (_) => _EditDialog(
                title: 'Change Phone',
                label: 'Phone number',
                initialValue: user?.phone ?? '',
                keyboardType: TextInputType.phone,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return null; // optional
                  return v.trim().length < 7
                      ? 'Enter a valid phone number'
                      : null;
                },
                onSave: (v) => ref
                    .read(authProvider.notifier)
                    .updateProfile(phone: v.trim()),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // ── Appearance ───────────────────────────────────────────
          const _SectionLabel(label: 'APPEARANCE'),
          const SizedBox(height: 8),

          Card(
            clipBehavior: Clip.antiAlias,
            elevation: 2,
            shadowColor: Colors.black.withValues(alpha: 0.05),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            child: InkWell(
              onTap: () =>
                  ref.read(themeProvider.notifier).toggleTheme(!isDark),
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                child: Row(
                  children: [
                    Icon(isDark ? Icons.dark_mode : Icons.light_mode,
                        size: 28, color: theme.primaryColor),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Text('Dark Mode',
                          style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.w600)),
                    ),
                    Switch(
                      value: isDark,
                      activeColor: theme.primaryColor,
                      onChanged: (val) =>
                          ref.read(themeProvider.notifier).toggleTheme(val),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // ── Account ──────────────────────────────────────────────
          const _SectionLabel(label: 'ACCOUNT'),
          const SizedBox(height: 8),

          Card(
            clipBehavior: Clip.antiAlias,
            elevation: 0,
            color: theme.colorScheme.error.withValues(alpha: 0.1),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                  color: theme.colorScheme.error.withValues(alpha: 0.3)),
            ),
            child: InkWell(
              onTap: () => ref.read(authProvider.notifier).logout(),
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                child: Row(
                  children: [
                    Icon(Icons.logout_rounded,
                        size: 28, color: theme.colorScheme.error),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        'Logout',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.error,
                        ),
                      ),
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

// ─── Edit dialog — proper StatefulWidget so _saving is real instance state ─────

class _EditDialog extends StatefulWidget {
  const _EditDialog({
    required this.title,
    required this.label,
    required this.initialValue,
    required this.keyboardType,
    required this.validator,
    required this.onSave,
  });

  final String title;
  final String label;
  final String initialValue;
  final TextInputType keyboardType;
  final String? Function(String?) validator;
  final Future<void> Function(String) onSave;

  @override
  State<_EditDialog> createState() => _EditDialogState();
}

class _EditDialogState extends State<_EditDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _controller;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialValue);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(
        widget.title,
        style:
            const TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
      ),
      content: Form(
        key: _formKey,
        child: TextFormField(
          controller: _controller,
          keyboardType: widget.keyboardType,
          autofocus: true,
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            labelText: widget.label,
            border:
                OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
          validator: widget.validator,
          onFieldSubmitted: (_) => _submit(),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _saving ? null : _submit,
          child: _saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Save'),
        ),
      ],
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.onSave(_controller.text);
      if (!mounted) return;
      setState(() => _saving = false);
      
      // IMPORTANT: Capture messenger BEFORE pop.
      // After Navigator.pop the dialog element begins deactivating.
      // Calling ScaffoldMessenger.of(context) on a deactivating element
      // throws "_dependents.isEmpty: is not true".
      final messenger = ScaffoldMessenger.of(context);
      final title = widget.title;
      Navigator.pop(context);
      messenger.showSnackBar(
        SnackBar(
          content: Text('$title updated'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.message),
          backgroundColor: Theme.of(context).colorScheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Theme.of(context).colorScheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}

// ─── Settings card ─────────────────────────────────────────────────────────────

class _SettingsCard extends StatelessWidget {
  const _SettingsCard({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      shadowColor: Colors.black.withValues(alpha: 0.05),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Row(
            children: [
              Icon(icon, size: 28, color: theme.primaryColor),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w600)),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        style: TextStyle(
                          fontSize: 14,
                          color: theme.textTheme.bodyMedium?.color
                              ?.withValues(alpha: 0.6),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              Icon(Icons.edit_outlined,
                  size: 20,
                  color: theme.textTheme.bodyMedium?.color
                      ?.withValues(alpha: 0.4)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Section label ─────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.4,
          color: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.color
              ?.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}
