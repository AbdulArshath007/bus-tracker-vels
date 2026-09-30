import 'package:json_annotation/json_annotation.dart';

part 'chat_message.g.dart';

@JsonSerializable()
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.senderName,
    required this.senderRole,
    required this.createdAt,
    this.content,
    this.attachmentUrl,
    this.attachmentType,
    this.isDeleted = false,
  });

  final String id;

  @JsonKey(name: 'room_id')
  final String roomId;

  @JsonKey(name: 'sender_id')
  final String senderId;

  @JsonKey(name: 'sender_name')
  final String senderName;

  @JsonKey(name: 'sender_role')
  final String senderRole;

  final String? content;

  @JsonKey(name: 'attachment_url')
  final String? attachmentUrl;

  @JsonKey(name: 'attachment_type')
  final String? attachmentType;

  @JsonKey(name: 'created_at')
  final String createdAt;
  
  @JsonKey(name: 'is_deleted', defaultValue: false)
  final bool isDeleted;

  bool get isFromDriver => senderRole == 'driver';

  ChatMessage copyWith({
    String? id,
    String? roomId,
    String? senderId,
    String? senderName,
    String? senderRole,
    String? createdAt,
    String? content,
    String? attachmentUrl,
    String? attachmentType,
    bool? isDeleted,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      roomId: roomId ?? this.roomId,
      senderId: senderId ?? this.senderId,
      senderName: senderName ?? this.senderName,
      senderRole: senderRole ?? this.senderRole,
      createdAt: createdAt ?? this.createdAt,
      content: content ?? this.content,
      attachmentUrl: attachmentUrl ?? this.attachmentUrl,
      attachmentType: attachmentType ?? this.attachmentType,
      isDeleted: isDeleted ?? this.isDeleted,
    );
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) =>
      _$ChatMessageFromJson(json);

  Map<String, dynamic> toJson() => _$ChatMessageToJson(this);
}
