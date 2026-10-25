import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:vels_student/app_config.dart';
import 'package:vels_student/core/session_manager.dart';

enum SocketConnectionStatus {
  disconnected,
  connecting,
  connected,
  reconnecting,
  error,
}

class SocketManager {
  SocketManager._();
  static final SocketManager instance = SocketManager._();

  io.Socket? _socket;

  final _statusController = StreamController<SocketConnectionStatus>.broadcast();
  Stream<SocketConnectionStatus> get statusStream => _statusController.stream;

  SocketConnectionStatus _status = SocketConnectionStatus.disconnected;
  SocketConnectionStatus get status => _status;

  // ─── Connect ──────────────────────────────────────────────────────────────

  Future<void> connect() async {
    if (_socket?.connected == true) return;

    final token = await SessionManager.instance.getAccessToken();

    _socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token})
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .enableReconnection()
          .setReconnectionDelay(2000)
          .setReconnectionDelayMax(30000)
          .build(),
    );

    _socket!
      ..onConnect((_) {
        _emit(SocketConnectionStatus.connected);
        if (kDebugMode) debugPrint('[StudentSocket] Connected to bus tracker');
      })
      ..onDisconnect((_) {
        _emit(SocketConnectionStatus.disconnected);
        if (kDebugMode) debugPrint('[StudentSocket] Disconnected');
      })
      ..onReconnecting((_) {
        _emit(SocketConnectionStatus.reconnecting);
        if (kDebugMode) debugPrint('[StudentSocket] Reconnecting...');
      })
      ..onReconnect((_) async {
        final freshToken = await SessionManager.instance.getAccessToken();
        _socket?.auth = {'token': freshToken};
        _emit(SocketConnectionStatus.connected);
        if (kDebugMode) debugPrint('[StudentSocket] Reconnected — auth refreshed');
      })
      ..onConnectError((data) {
        _emit(SocketConnectionStatus.error);
        if (kDebugMode) debugPrint('[StudentSocket] Connect error: $data');
      })
      ..connect();

    _emit(SocketConnectionStatus.connecting);
  }

  // ─── Room Management ──────────────────────────────────────────────────────

  void joinBusRoom(String busId) {
    emit('join:bus', {'busId': busId});
  }

  void joinRouteRoom(String routeId) {
    emit('join:route', {'routeId': routeId});
  }

  void joinChatRoom(String roomId) {
    emit('chat:join', {'roomId': roomId});
  }

  // ─── Emit & Listen ────────────────────────────────────────────────────────

  void emit(String event, dynamic data) {
    if (_socket?.connected != true) {
      if (kDebugMode) debugPrint('[StudentSocket] Not connected; skipping "$event"');
      return;
    }
    _socket!.emit(event, data);
  }

  void on(String event, void Function(dynamic) handler) {
    _socket?.on(event, handler);
  }

  void off(String event) {
    _socket?.off(event);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _emit(SocketConnectionStatus.disconnected);
  }

  bool get isConnected => _socket?.connected == true;

  void _emit(SocketConnectionStatus status) {
    _status = status;
    if (!_statusController.isClosed) {
      _statusController.add(status);
    }
  }

  void dispose() {
    disconnect();
    _statusController.close();
  }
}
