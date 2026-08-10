// ─── Users Service ────────────────────────────────────────────────────────────
import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { AuditService } from '../audit/audit.service';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsNotEmpty() @MinLength(8) password: string;
  @ApiProperty({ enum: ['student', 'driver'] })
  @IsEnum(['student', 'driver'])
  role: UserRole;
  @ApiProperty() @IsNotEmpty() full_name: string;
  @ApiProperty({ required: false }) @IsOptional() phone?: string;
}

export class UpdateUserDto {
  @ApiProperty({ required: false }) @IsOptional() full_name?: string;
  @ApiProperty({ required: false }) @IsOptional() phone?: string;
  @ApiProperty({ required: false }) @IsOptional() language_pref?: 'en' | 'ta';
  @ApiProperty({ required: false }) @IsOptional() theme_pref?: 'light' | 'dark';
  @ApiProperty({ required: false }) @IsOptional() fcm_token?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private auditService: AuditService,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async list(filters: {
    role?: string;
    isActive?: boolean;
    q?: string;
    limit?: number;
    cursor?: string;
  }) {
    const limit = Math.min(filters.limit ?? 50, 100);
    const qb = this.repo.createQueryBuilder('u');
    if (filters.role) qb.andWhere('u.role = :role', { role: filters.role });
    if (filters.isActive !== undefined)
      qb.andWhere('u.is_active = :isActive', { isActive: filters.isActive });
    if (filters.q) {
      qb.andWhere('(u.full_name ILIKE :q OR u.email ILIKE :q)', {
        q: `%${filters.q}%`,
      });
    }
    if (filters.cursor)
      qb.andWhere('u.created_at < :cursor', { cursor: filters.cursor });

    qb.select([
      'u.id', 'u.email', 'u.role', 'u.fullName', 'u.phone',
      'u.languagePref', 'u.themePref', 'u.isActive', 'u.createdAt',
    ])
      .orderBy('u.created_at', 'DESC')
      .take(limit + 1);

    const rows = await qb.getMany();
    return { data: rows.slice(0, limit), hasMore: rows.length > limit };
  }

  async create(dto: CreateUserDto, actorId: string): Promise<User> {
    const existing = await this.repo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
      fullName: dto.full_name,
      phone: dto.phone,
    });
    await this.repo.save(user);

    await this.auditService.log({
      actorId,
      actorRole: 'admin',
      action: 'user.create',
      targetType: 'user',
      targetId: user.id,
      metadata: { role: dto.role, email: dto.email },
    });

    const { passwordHash: _, ...safe } = user as any;
    return safe;
  }

  async updateSelf(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.repo.findOneOrFail({ where: { id: userId } });
    if (dto.full_name) user.fullName = dto.full_name;
    if (dto.phone) user.phone = dto.phone;
    if (dto.language_pref) user.languagePref = dto.language_pref;
    if (dto.theme_pref) user.themePref = dto.theme_pref;
    if (dto.fcm_token !== undefined) user.fcmToken = dto.fcm_token;
    await this.repo.save(user);
    const { passwordHash: _, ...safe } = user as any;
    return safe;
  }

  async updateByAdmin(
    targetId: string,
    dto: UpdateUserDto,
    actorId: string,
  ): Promise<User> {
    const user = await this.repo.findOneOrFail({ where: { id: targetId } });
    if (dto.full_name) user.fullName = dto.full_name;
    if (dto.phone) user.phone = dto.phone;
    await this.repo.save(user);
    await this.auditService.log({
      actorId,
      actorRole: 'admin',
      action: 'user.update',
      targetType: 'user',
      targetId,
    });
    const { passwordHash: _, ...safe } = user as any;
    return safe;
  }

  async deactivate(targetId: string, actorId: string): Promise<void> {
    await this.repo.update(targetId, { isActive: false });
    await this.auditService.log({
      actorId,
      actorRole: 'admin',
      action: 'user.deactivate',
      targetType: 'user',
      targetId,
    });
  }
}
