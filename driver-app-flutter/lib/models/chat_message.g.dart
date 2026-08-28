// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_message.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ChatMessage _$ChatMessageFromJson(Map<String, dynamic> json) => ChatMessage(
      id: json['id'] as String,
      roomId: json['room_id'] as String,
      senderId: json['sender_id'] as String,
      senderName: json['sender_name'] as String,
      senderRole: json['sender_role'] as String,
      createdAt: json['created_at'] as String,
      text: json['text'] as String?,
      attachmentUrl: json['attachment_url'] as String?,
      attachmentType: json['attachment_type'] as String?,
    );

Map<String, dynamic> _$ChatMessageToJson(ChatMessage instance) =>
    <String, dynamic>{
      'id': instance.id,
      'room_id': instance.roomId,
      'sender_id': instance.senderId,
      'sender_name': instance.senderName,
      'sender_role': instance.senderRole,
      'text': instance.text,
      'attachment_url': instance.attachmentUrl,
      'attachment_type': instance.attachmentType,
      'created_at': instance.createdAt,
    };
