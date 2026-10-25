import 'dart:async';
import 'package:flutter/foundation.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_driver/app_config.dart';
import 'package:vels_driver/core/session_manager.dart';
import 'package:vels_driver/core/socket_manager.dart';
import 'package:vels_driver/models/chat_message.dart';
import 'package:vels_driver/models/user_profile.dart';
import 'package:vels_driver/providers/session_provider.dart';

// ─── Chat Notifier ─────────────────────────────────────────────────────────

class ChatNotifier extends StateNotifier<List<ChatMessage>> {
  ChatNotifier(this._session) : super([]) {
    _initChat();
  }

  final SessionManager _session;
  String? _roomId;
  String? roomName;
  UserProfile? _currentUser;
  
  bool get hasRoom => _roomId != null;

  Future<void> _initChat() async {
    try {
      _currentUser = await _session.getUser();
      // MOCK DATA for chat since we are bypassing backend
      _roomId = 'mock_room_1';
      roomName = 'Route Chat (Mock)';
      
      state = [];
    } catch (e) {
      debugPrint('[ChatProvider] Init error: $e');
    }
  }

  /// Sends a chat message via REST API.
  Future<void> sendMessage(String text) async {
    final sanitised = text.trim();
    if (sanitised.isEmpty) return;
    if (sanitised.length > AppConfig.chatMaxLength) return;
    if (_roomId == null) return;

    // Optimistically add message to state immediately so the UI updates
    final me = _currentUser;
    final optimisticMsg = ChatMessage(
      id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
      roomId: _roomId!,
      senderId: me?.id ?? 'me',
      senderName: me?.name ?? 'You',
      senderRole: 'driver',
      createdAt: DateTime.now().toIso8601String(),
      content: sanitised,
    );
    state = [optimisticMsg, ...state];

    try {
      // Mock network delay
      await Future.delayed(const Duration(milliseconds: 300));
      // In mock mode, we keep the optimistic message.
    } catch (e) {
      debugPrint('[ChatProvider] Send message error: $e');
      // Remove optimistic message on failure
      state = state.where((m) => m.id != optimisticMsg.id).toList();
    }
  }

  @override
  void dispose() {
    SocketManager.instance.off('chat.message');
    SocketManager.instance.off('chat.message_deleted');
    super.dispose();
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────

final chatProvider =
    StateNotifierProvider<ChatNotifier, List<ChatMessage>>(
  (ref) => ChatNotifier(ref.read(sessionManagerProvider)),
);
