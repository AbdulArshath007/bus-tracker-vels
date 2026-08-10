// ─── Auth Controller ──────────────────────────────────────────────────────────
import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, LogoutDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    auth: {
      limit: 10,
      ttl: 900000,
    },
  })
  @ApiOperation({ summary: 'Login and receive access + refresh tokens' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    return this.authService.login(dto.email, dto.password, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 20, ttl: 900000 } })
  @ApiOperation({ summary: 'Rotate refresh token and get new access token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke refresh token' })
  async logout(@Body() dto: LogoutDto, @Req() req: any) {
    await this.authService.logout(dto.refresh_token, req.user.id);
  }
}
