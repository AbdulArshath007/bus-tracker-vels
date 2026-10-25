class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.senderName,
    required this.senderRole,
    required this.content,
    required this.createdAt,
    this.attachmentUrl,
  });

  final String id;
  final String roomId;
  final String senderId;
  final String senderName;
  final String senderRole;
  final String content;
  final String createdAt;
  final String? attachmentUrl;

  bool get isDriver => senderRole.toLowerCase() == 'driver';
  bool get isAdmin => senderRole.toLowerCase() == 'admin';
  bool get isStudent => senderRole.toLowerCase() == 'student';

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id']?.toString() ?? '',
      roomId: json['room_id']?.toString() ?? json['roomId']?.toString() ?? '',
      senderId: json['sender_id']?.toString() ?? json['senderId']?.toString() ?? '',
      senderName: json['sender_name'] as String? ?? json['sender']?['full_name'] as String? ?? 'User',
      senderRole: json['sender_role'] as String? ?? json['sender']?['role'] as String? ?? 'student',
      content: json['content'] as String? ?? '',
      createdAt: json['created_at'] as String? ?? json['createdAt'] as String? ?? DateTime.now().toIso8601String(),
      attachmentUrl: json['attachment_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'room_id': roomId,
    'sender_id': senderId,
    'sender_name': senderName,
    'sender_role': senderRole,
    'content': content,
    'created_at': createdAt,
    'attachment_url': attachmentUrl,
  };
}
