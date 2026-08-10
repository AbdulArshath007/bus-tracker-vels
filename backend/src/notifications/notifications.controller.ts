// ─── Notifications Controller ─────────────────────────────────────────────────
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { NotificationsService } from './notifications.service';

class AnnounceDto {
  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsUUID()
  route_id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title_ta?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  body_ta?: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('notifications')
export class NotificationsController {
  constructor(private notifService: NotificationsService) {}

  @Post('announce')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send announcement to students (admin only)' })
  async announce(@Body() dto: AnnounceDto) {
    const count = await this.notifService.sendAnnouncement(
      dto.route_id ?? null,
      {
        trigger: 'announcement',
        title: dto.title,
        titleTa: dto.title_ta,
        body: dto.body,
        bodyTa: dto.body_ta,
      },
    );
    return { queued: true, recipient_count: count };
  }
}
