// ─── Users Controller ─────────────────────────────────────────────────────────
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  getMe(@Req() req: any) {
    // Return user without passwordHash (already excluded by JwtStrategy)
    const { passwordHash, ...safe } = req.user;
    return safe;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateSelf(req.user.id, dto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List users (admin)' })
  list(
    @Query('role') role?: string,
    @Query('is_active') isActive?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.usersService.list({
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      q,
      limit: limit ? parseInt(limit, 10) : 50,
      cursor,
    });
  }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create student or driver account (admin)' })
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.usersService.create(dto, req.user.id);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  getById(@Param('id') id: string) {
    // IDOR: return same generic error whether user exists or not
    return this.usersService.findById(id).then((u) => {
      if (!u) throw new ForbiddenException('Not authorized.');
      const { passwordHash, ...safe } = u as any;
      return safe;
    });
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user (admin)' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: any,
  ) {
    return this.usersService.updateByAdmin(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate user (admin, soft delete)' })
  deactivate(@Param('id') id: string, @Req() req: any) {
    return this.usersService.deactivate(id, req.user.id);
  }
}
