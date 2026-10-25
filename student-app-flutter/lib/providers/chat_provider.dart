import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vels_student/app_config.dart';
import 'package:vels_student/core/session_manager.dart';
import 'package:vels_student/core/socket_manager.dart';
import 'package:vels_student/models/chat_message.dart';
import 'package:vels_student/models/user_profile.dart';
import 'package:vels_student/providers/session_provider.dart';

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
      _roomId = 'route_14_chat';
      roomName = 'Route 14 (Tambaram - Campus)';

      // Seed initial messages with realistic communication between driver and students
      state = [
        ChatMessage(
          id: 'msg_3',
          roomId: _roomId!,
          senderId: 'driver_velan',
          senderName: 'Velan (Driver)',
          senderRole: 'driver',
          content: 'Approaching Chromepet flyover now. Heavy traffic near the signal, 5 mins delayed.',
          createdAt: DateTime.now().subtract(const Duration(minutes: 6)).toIso8601String(),
        ),
        ChatMessage(
          id: 'msg_2',
          roomId: _roomId!,
          senderId: 'student_rahul',
          senderName: 'Rahul (CSE)',
          senderRole: 'student',
          content: 'Driver sir, please wait 1 minute at Tambaram Sanatorium stop.',
          createdAt: DateTime.now().subtract(const Duration(minutes: 12)).toIso8601String(),
        ),
        ChatMessage(
          id: 'msg_1',
          roomId: _roomId!,
          senderId: 'driver_velan',
          senderName: 'Velan (Driver)',
          senderRole: 'driver',
          content: 'Good morning students! Bus #01 started from Tambaram depot. Board on time.',
          createdAt: DateTime.now().subtract(const Duration(minutes: 25)).toIso8601String(),
        ),
      ];

      // Join socket room
      SocketManager.instance.joinChatRoom(_roomId!);

      // Listen for incoming messages
      SocketManager.instance.on('chat.message', (data) {
        if (data == null || !mounted) return;
        try {
          final newMsg = ChatMessage.fromJson(data as Map<String, dynamic>);
          // Avoid duplicate messages
          if (!state.any((m) => m.id == newMsg.id)) {
            state = [newMsg, ...state];
          }
        } catch (e) {
          if (kDebugMode) debugPrint('[StudentChat] Message parse error: $e');
        }
      });

      // Listen for moderation deletion
      SocketManager.instance.on('chat.message_deleted', (data) {
        if (data == null || !mounted) return;
        try {
          final id = (data as Map<String, dynamic>)['message_id']?.toString();
          if (id != null) {
            state = state.where((m) => m.id != id).toList();
          }
        } catch (_) {}
      });
    } catch (e) {
      if (kDebugMode) debugPrint('[StudentChat] Init error: $e');
    }
  }

  Future<void> sendMessage(String text) async {
    final sanitised = text.trim();
    if (sanitised.isEmpty) return;
    if (sanitised.length > AppConfig.chatMaxLength) return;
    if (_roomId == null) return;

    final me = _currentUser;
    final optimisticMsg = ChatMessage(
      id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
      roomId: _roomId!,
      senderId: me?.id ?? 'student_me',
      senderName: me?.name ?? 'You',
      senderRole: 'student',
      content: sanitised,
      createdAt: DateTime.now().toIso8601String(),
    );

    // Optimistically insert at top
    state = [optimisticMsg, ...state];

    try {
      // Emit via socket if online
      if (SocketManager.instance.isConnected) {
        SocketManager.instance.emit('chat.send', {
          'roomId': _roomId,
          'content': sanitised,
        });
      }
      await Future.delayed(const Duration(milliseconds: 250));
    } catch (e) {
      if (kDebugMode) debugPrint('[StudentChat] Send error: $e');
    }
  }

  @override
  void dispose() {
    SocketManager.instance.off('chat.message');
    SocketManager.instance.off('chat.message_deleted');
    super.dispose();
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, List<ChatMessage>>(
  (ref) => ChatNotifier(ref.read(sessionManagerProvider)),
);
