import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_student/app_config.dart';
import 'package:vels_student/models/chat_message.dart';
import 'package:vels_student/providers/chat_provider.dart';
import 'package:vels_student/providers/session_provider.dart';
import 'package:vels_student/theme/app_theme.dart';
import 'package:vels_student/widgets/connection_badge.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isComposing = false;

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _handleSend() {
    final text = _textController.text;
    if (text.trim().isEmpty) return;

    ref.read(chatProvider.notifier).sendMessage(text);
    _textController.clear();
    setState(() => _isComposing = false);

    // Smooth scroll to bottom
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatProvider);
    final authState = ref.watch(authProvider);
    final theme = Theme.of(context);
    final currentUser = authState is AuthAuthenticated ? authState.user : null;

    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Route 14 Bus Chat',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
            ),
            Text(
              'Velan (Driver) & 32 Students on Route',
              style: TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ],
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: Center(child: ConnectionBadge()),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Chat Safety Banner ────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: theme.primaryColor.withValues(alpha: 0.08),
            child: Row(
              children: [
                Icon(Icons.info_outline, size: 16, color: theme.primaryColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Direct bus route channel. Keep conversations helpful and respectful.',
                    style: TextStyle(
                      fontSize: 11.5,
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Messages List (Reverse) ───────────────────────────────────────
          Expanded(
            child: messages.isEmpty
                ? Center(
                    child: Text(
                      'No messages yet.\nSay hello to your driver & route mates!',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                        fontSize: 13,
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    reverse: true,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final msg = messages[index];
                      final isMe = msg.senderId == (currentUser?.id ?? 'student_me') ||
                          msg.senderName == 'You';

                      return _ChatBubble(
                        message: msg,
                        isMe: isMe,
                        theme: theme,
                      );
                    },
                  ),
          ),

          const Divider(height: 1),

          // ── Message Input Bar ─────────────────────────────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      maxLength: AppConfig.chatMaxLength,
                      buildCounter: (_, {required currentLength, isFocused, maxLength}) => null,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Message driver & students...',
                        hintStyle: TextStyle(
                          fontSize: 14,
                          color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide(color: theme.dividerColor),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide(
                            color: theme.dividerColor.withValues(alpha: 0.5),
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide(color: theme.primaryColor, width: 1.5),
                        ),
                      ),
                      onChanged: (text) {
                        setState(() => _isComposing = text.trim().isNotEmpty);
                      },
                      onSubmitted: (_) => _handleSend(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _isComposing ? _handleSend : null,
                    icon: const Icon(Icons.send_rounded, size: 20),
                    style: IconButton.styleFrom(
                      backgroundColor: theme.primaryColor,
                      disabledBackgroundColor:
                          theme.colorScheme.onSurface.withValues(alpha: 0.12),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({
    required this.message,
    required this.isMe,
    required this.theme,
  });

  final ChatMessage message;
  final bool isMe;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    final isDriver = message.isDriver;
    final isAdmin = message.isAdmin;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment:
            isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          // Sender Header (if not me)
          if (!isMe)
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 3),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    message.senderName,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 6),
                  if (isDriver)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 1.5,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.drive_eta_rounded,
                              size: 11, color: AppTheme.primary),
                          SizedBox(width: 3),
                          Text(
                            'DRIVER',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (isAdmin)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 1.5,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.purple.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'STAFF',
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.purple,
                        ),
                      ),
                    ),
                ],
              ),
            ),

          // Message Bubble
          ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.78,
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isMe
                    ? theme.primaryColor
                    : (isDriver
                        ? theme.primaryColor.withValues(alpha: 0.12)
                        : (theme.brightness == Brightness.dark
                            ? AppTheme.darkSurface
                            : Colors.white)),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isMe ? 16 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 16),
                ),
                border: isMe
                    ? null
                    : Border.all(
                        color: isDriver
                            ? theme.primaryColor.withValues(alpha: 0.3)
                            : theme.dividerColor.withValues(alpha: 0.5),
                      ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Text(
                message.content,
                style: TextStyle(
                  color: isMe
                      ? Colors.white
                      : theme.colorScheme.onSurface,
                  fontSize: 14,
                  height: 1.35,
                ),
              ),
            ),
          ),

          // Timestamp
          Padding(
            padding: const EdgeInsets.only(top: 2, left: 4, right: 4),
            child: Text(
              _formatTime(message.createdAt),
              style: TextStyle(
                fontSize: 10,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.45),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(String raw) {
    try {
      final dt = DateTime.parse(raw).toLocal();
      final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
      final m = dt.minute.toString().padLeft(2, '0');
      final ampm = dt.hour >= 12 ? 'PM' : 'AM';
      return '$h:$m $ampm';
    } catch (_) {
      return '';
    }
  }
}
