import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_driver/app_config.dart';
import 'package:vels_driver/core/session_manager.dart';
import 'package:vels_driver/core/socket_manager.dart';
import 'package:vels_driver/models/chat_message.dart';
import 'package:vels_driver/providers/session_provider.dart';

// ─── Chat Notifier ─────────────────────────────────────────────────────────

class ChatNotifier extends StateNotifier<List<ChatMessage>> {
  ChatNotifier(this._session) : super([]) {
    _connect();
  }

  final SessionManager _session;
  String? _roomId;

  Future<void> _connect() async {
    final user = await _session.getUser();
    _roomId = user?.routeId;
    if (_roomId == null) return;

    await SocketManager.instance.connect();

    SocketManager.instance.on('chat.message', (data) {
      try {
        final map = data as Map<String, dynamic>;
        final msg = ChatMessage.fromJson(map);
        // Insert newest message at the front (reversed layout)
        state = [msg, ...state];
      } catch (_) {
        // Ignore malformed messages from server
      }
    });

    SocketManager.instance.emit('chat.join', {'room_id': _roomId});
  }

  /// Sends a chat message.
  ///
  /// Fixes vulnerability #11: text is trimmed and length-checked before emit.
  void sendMessage(String text) {
    // ── Sanitisation (fix #11) ────────────────────────────────
    final sanitised = text.trim();
    if (sanitised.isEmpty) return;
    if (sanitised.length > AppConfig.chatMaxLength) return;
    if (_roomId == null) return;

    SocketManager.instance.emit('chat.send', {
      'room_id': _roomId,
      'text': sanitised,
    });
  }

  @override
  void dispose() {
    SocketManager.instance.off('chat.message');
    super.dispose();
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────

final chatProvider =
    StateNotifierProvider<ChatNotifier, List<ChatMessage>>(
  (ref) => ChatNotifier(ref.read(sessionManagerProvider)),
);
