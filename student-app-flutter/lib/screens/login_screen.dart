import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_student/providers/session_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter your email/register number and password'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    ref.read(authProvider.notifier).login(email: email, password: password);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState is AuthLoading;
    final errorMsg = authState is AuthError ? authState.message : null;
    final theme = Theme.of(context);

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ─── VELS University Logo Header ──────────────────────────
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: Image.asset(
                        'assets/icon/app_icon.png',
                        height: 72,
                      ),
                    ),
                  ),

                  // ─── Blue Title Bar (Respect to Driver App Design) ────────
                  Container(
                    color: theme.primaryColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: const Center(
                      child: Text(
                        'VELS Student Log In',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                  ),

                  // ─── Form Body ──────────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 36),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (errorMsg != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.error.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: theme.colorScheme.error.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.error_outline,
                                    size: 20, color: theme.colorScheme.error),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    errorMsg,
                                    style: TextStyle(
                                      color: theme.colorScheme.error,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],

                        // Email / Reg No
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Student Email or Register No.',
                            hintText: 'e.g. 2024vels1089@vistas.ac.in',
                            prefixIcon: Icon(Icons.badge_outlined),
                          ),
                          enabled: !isLoading,
                          textInputAction: TextInputAction.next,
                        ),
                        const SizedBox(height: 16),

                        // Password
                        TextField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                              ),
                              onPressed: () =>
                                  setState(() => _obscurePassword = !_obscurePassword),
                            ),
                          ),
                          enabled: !isLoading,
                          onSubmitted: (_) => _submit(),
                        ),
                        const SizedBox(height: 24),

                        // Submit Button
                        ElevatedButton(
                          onPressed: isLoading ? null : _submit,
                          child: isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Log In to Bus Tracker'),
                        ),
                        const SizedBox(height: 16),

                        // Demo Quick Access
                        OutlinedButton.icon(
                          onPressed: isLoading
                              ? null
                              : () => ref.read(authProvider.notifier).loginAsGuest(),
                          icon: const Icon(Icons.flash_on_rounded, size: 18),
                          label: const Text('Quick Demo Student Access'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            side: BorderSide(color: theme.primaryColor),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Helper Text
                        Center(
                          child: Text(
                            'VELS Institute of Science, Technology & Advanced Studies',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 11,
                              color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
