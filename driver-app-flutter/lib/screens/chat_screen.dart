import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_driver/app_config.dart';
import 'package:vels_driver/models/chat_message.dart';
import 'package:vels_driver/providers/chat_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _textCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  @override
  void dispose() {
    _textCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _send() {
    final text = _textCtrl.text;
    if (text.trim().isEmpty) return;
    if (text.trim().length > AppConfig.chatMaxLength) return;
    ref.read(chatProvider.notifier).sendMessage(text);
    _textCtrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatProvider);
    final roomName = ref.read(chatProvider.notifier).roomName ?? 'Route Chat';

    return Scaffold(
      appBar: AppBar(
        title: Text(roomName),
        leading: const Icon(Icons.chat_bubble_outline_rounded),
      ),
      body: Column(
        children: [
          Expanded(
            child: messages.isEmpty
                ? _EmptyChat()
                : ListView.builder(
                    controller: _scrollCtrl,
                    reverse: true,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: messages.length,
                    itemBuilder: (_, i) => _ChatBubble(message: messages[i]),
                  ),
          ),
          _InputBar(
            controller: _textCtrl,
            onSend: _send,
          ),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.message});
  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final isDriver = message.isFromDriver;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Capitalize first letter of role
    final roleDisplay = message.senderRole.isEmpty 
        ? '' 
        : message.senderRole[0].toUpperCase() + message.senderRole.substring(1);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: isDriver ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isDriver) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: theme.colorScheme.secondary.withValues(alpha: 0.2),
              child: Text(
                message.senderName.isNotEmpty ? message.senderName[0].toUpperCase() : '?',
                style: TextStyle(
                    color: theme.colorScheme.secondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isDriver ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isDriver)
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 4),
                    child: Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: '${message.senderName} ',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.8),
                            ),
                          ),
                          TextSpan(
                            text: '($roleDisplay)',
                            style: TextStyle(
                              fontSize: 11,
                              fontStyle: FontStyle.italic,
                              color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.6),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  decoration: BoxDecoration(
                    color: isDriver ? theme.primaryColor : theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(6),
                    border: isDriver
                        ? null
                        : Border.all(
                            color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                            width: 1,
                          ),
                  ),
                  child: Text(
                    message.text ?? '',
                    style: TextStyle(
                      color: isDriver ? Colors.white : theme.textTheme.bodyMedium?.color,
                      fontSize: 14,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text(
                    _formatTime(message.createdAt),
                    style: TextStyle(
                      fontSize: 10,
                      color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.4),
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

  String _formatTime(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      return '$h:$m';
    } catch (_) {
      return '';
    }
  }
}

class _InputBar extends StatefulWidget {
  const _InputBar({required this.controller, required this.onSend});
  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  State<_InputBar> createState() => _InputBarState();
}

class _InputBarState extends State<_InputBar> {
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(() {
      final has = widget.controller.text.trim().isNotEmpty;
      if (has != _hasText) setState(() => _hasText = has);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 8, 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0), 
            width: 1
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: widget.controller,
              style: TextStyle(color: theme.textTheme.bodyMedium?.color, fontSize: 14),
              maxLines: null,
              maxLength: AppConfig.chatMaxLength,
              buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
              decoration: InputDecoration(
                hintText: 'Type a message…',
                hintStyle: TextStyle(
                  color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.4),
                ),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
              ),
              onSubmitted: (_) => widget.onSend(),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: _hasText ? widget.onSend : null,
            icon: const Icon(Icons.send_rounded),
            color: theme.primaryColor,
            style: IconButton.styleFrom(
              backgroundColor: _hasText
                  ? theme.primaryColor.withValues(alpha: 0.1)
                  : Colors.transparent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyChat extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline_rounded,
            size: 64,
            color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.15),
          ),
          const SizedBox(height: 16),
          Text(
            'No messages yet',
            style: TextStyle(
              fontSize: 16,
              color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.4),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
