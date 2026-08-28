// ─── Chat Controller ──────────────────────────────────────────────────────────
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { ChatService } from './chat.service';

class SendMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  content: string;
}

class AddMemberDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @ApiProperty({ enum: ['student', 'driver'], required: false })
  @IsOptional()
  @IsString()
  role?: string;
}

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chat-rooms')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  @Roles('student', 'driver', 'admin')
  @ApiOperation({ summary: 'List chat rooms accessible to the caller' })
  listRooms(@Req() req: any) {
    return this.chatService.listRooms(req.user);
  }

  @Get(':id')
  @Roles('student', 'driver', 'admin')
  @ApiOperation({ summary: 'Get chat room details' })
  getRoom(@Param('id') id: string, @Req() req: any) {
    return this.chatService.getRoom(id, req.user);
  }

  @Get(':id/members')
  @Roles('admin')
  @ApiOperation({ summary: 'Get room members (admin)' })
  getMembers(@Param('id') id: string) {
    return this.chatService.getMembers(id);
  }

  @Post(':id/members')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add member to chat room (admin)' })
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.chatService.addMember(id, dto.user_id, dto.role || 'student');
  }

  @Delete(':id/members/:userId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from chat room (admin)' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.chatService.removeMember(id, userId);
  }

  @Get(':id/messages')
  @Roles('student', 'driver', 'admin')
  @ApiOperation({ summary: 'List messages (paginated, newest first)' })
  listMessages(
    @Param('id') id: string,
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('before') cursor?: string,
  ) {
    return this.chatService.listMessages(
      id,
      req.user,
      limit ? parseInt(limit, 10) : 50,
      cursor,
    );
  }

  @Post(':id/messages')
  @Roles('student', 'driver', 'admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a text message' })
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
    return this.chatService.sendMessage(id, req.user, dto.content);
  }

  @Post(':id/attachments')
  @Roles('student', 'driver', 'admin')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file attachment' })
  uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('message_content') content: string,
    @Req() req: any,
  ) {
    return this.chatService.uploadAttachment(id, req.user, file, content);
  }

  @Get(':id/attachments/:attachmentId/download')
  @Roles('student', 'driver', 'admin')
  @ApiOperation({ summary: 'Get pre-signed download URL for attachment' })
  downloadUrl(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
  ) {
    return this.chatService.getDownloadUrl(id, attachmentId, req.user);
  }
}

// ── Message moderation (separate controller path) ─────────────────────────────
@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('messages')
export class MessagesController {
  constructor(private chatService: ChatService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a message (admin moderation)' })
  deleteMessage(@Param('id') id: string, @Req() req: any) {
    return this.chatService.deleteMessage(id, req.user);
  }
}
