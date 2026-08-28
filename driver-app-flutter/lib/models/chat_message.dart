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
    this.text,
    this.attachmentUrl,
    this.attachmentType,
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

  final String? text;

  @JsonKey(name: 'attachment_url')
  final String? attachmentUrl;

  @JsonKey(name: 'attachment_type')
  final String? attachmentType;

  @JsonKey(name: 'created_at')
  final String createdAt;

  bool get isFromDriver => senderRole == 'driver';

  factory ChatMessage.fromJson(Map<String, dynamic> json) =>
      _$ChatMessageFromJson(json);

  Map<String, dynamic> toJson() => _$ChatMessageToJson(this);
}
