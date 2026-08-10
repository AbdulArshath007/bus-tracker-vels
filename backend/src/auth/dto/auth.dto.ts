// ─── Auth DTOs ────────────────────────────────────────────────────────────────
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'student@vels.edu.in' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}

export class LogoutDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}
