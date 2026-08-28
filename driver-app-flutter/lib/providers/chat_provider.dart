import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_driver/app_config.dart';
import 'package:vels_driver/core/session_manager.dart';
import 'package:vels_driver/core/socket_manager.dart';
import 'package:vels_driver/models/chat_message.dart';
import 'package:vels_driver/providers/session_provider.dart';

import 'package:vels_driver/core/api_client.dart';

// ─── Chat Notifier ─────────────────────────────────────────────────────────

class ChatNotifier extends StateNotifier<List<ChatMessage>> {
  ChatNotifier(this._session) : super([]) {
    _initChat();
  }

  final SessionManager _session;
  String? _roomId;
  String? roomName;

  Future<void> _initChat() async {
    try {
      // 1. Fetch available rooms from REST API
      final roomsResp = await ApiClient.instance.dio.get('/chat-rooms');
      final rooms = roomsResp.data as List;
      if (rooms.isEmpty) return; // No assigned rooms

      _roomId = rooms.first['id'] as String;
      roomName = rooms.first['room_name'] as String?;
      
      // Notify listeners that roomName changed (if the UI needs to rebuild on room name)
      // Since StateNotifier only triggers on `state` change, we can just re-assign state.
      state = [...state];

      // 2. Fetch message history
      final historyResp = await ApiClient.instance.dio.get('/chat-rooms/$_roomId/messages?limit=50');
      final historyData = historyResp.data['data'] as List;
      
      state = historyData
          .map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
          .toList();

      // 3. Connect to Socket for live updates
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

    try {
      await ApiClient.instance.dio.post(
        '/chat-rooms/$_roomId/messages',
        data: {'content': sanitised},
      );
      // We don't add to state manually here, because the backend will broadcast 
      // the 'chat.message' event via socket to all room members (including us).
    } catch (e) {
      debugPrint('[ChatProvider] Send message error: $e');
    }
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
