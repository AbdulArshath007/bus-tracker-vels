import 'dart:async';
import 'package:flutter/foundation.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_driver/app_config.dart';
import 'package:vels_driver/core/session_manager.dart';
import 'package:vels_driver/core/socket_manager.dart';
import 'package:vels_driver/models/chat_message.dart';
import 'package:vels_driver/models/user_profile.dart';
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
  UserProfile? _currentUser;
  
  bool get hasRoom => _roomId != null;

  Future<void> _initChat() async {
    try {
      _currentUser = await _session.getUser();
      // 1. Fetch available rooms from REST API
      final roomsResp = await ApiClient.instance.dio.get('/chat-rooms');
      final rooms = roomsResp.data as List;
      if (rooms.isEmpty) return; // No assigned rooms

      _roomId = rooms.first['id'] as String;
      roomName = (rooms.first['roomName'] ?? rooms.first['room_name']) as String?;
      roomName ??= 'Route Chat';
      
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
      
      // Emit chat.join to ensure backend puts our socket into this chat room
      // (Handles case where driver is added to room AFTER connecting to socket initially)
      SocketManager.instance.emit('chat.join', {'room_id': _roomId});

      SocketManager.instance.on('chat.message', (data) {
        try {
          final payload = (data is List && data.isNotEmpty) ? data.first : data;
          final map = Map<String, dynamic>.from(payload as Map);
          final msg = ChatMessage.fromJson(map);
          // Deduplicate based on content or sender for optimistic updates
          // Our optimistic update has id 'temp-...'. We can dedupe if we 
          // find an existing message with the same content from the same sender
          // sent in the last few seconds. Since we just replace the real ID from
          // REST response, let's just dedupe by real ID.
          if (state.any((m) => m.id == msg.id)) return; 
          
          // Also deduplicate optimistic messages that have the same content
          // to prevent double messages from our own send.
          if (state.any((m) => m.id.startsWith('temp-') && m.content == msg.content && m.senderId == msg.senderId)) {
            // Replace the optimistic message with the real one
            state = state.map((m) => (m.id.startsWith('temp-') && m.content == msg.content && m.senderId == msg.senderId) ? msg : m).toList();
            return;
          }

          // Insert newest message at the front (reversed layout)
          state = [msg, ...state];
        } catch (e) {
          debugPrint('[ChatProvider] Parse error for chat.message: $e');
        }
      });

      SocketManager.instance.on('chat.message_deleted', (data) {
        try {
          final payload = (data is List && data.isNotEmpty) ? data.first : data;
          final map = Map<String, dynamic>.from(payload as Map);
          final msgId = map['message_id'] as String?;
          if (msgId != null) {
            state = state.map((m) {
              if (m.id == msgId) {
                return m.copyWith(isDeleted: true);
              }
              return m;
            }).toList();
          }
        } catch (e) {
          debugPrint('[ChatProvider] Parse error for chat.message_deleted: $e');
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
      await ApiClient.instance.dio.post(
        '/chat-rooms/$_roomId/messages',
        data: {'content': sanitised},
      );
      // Server will broadcast chat.message via socket which will replace
      // the optimistic message. If socket isn't available, we keep optimistic.
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
