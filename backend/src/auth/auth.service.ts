// ─── Auth Service ─────────────────────────────────────────────────────────────
import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  // ── Login ──────────────────────────────────────────────────────────────────
  async login(
    email: string,
    password: string,
    ipAddress?: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: Partial<User>;
  }> {
    // Always perform the comparison to prevent timing attacks
    const user = await this.userRepo.findOne({
      where: { email, isActive: true },
    });

    const dummyHash =
      '$2b$12$invalidhashtopreventtimingattack.......................';
    const passwordMatch = await bcrypt.compare(
      password,
      user ? user.passwordHash : dummyHash,
    );

    if (!user || !passwordMatch) {
      await this.auditService.log({
        actorId: undefined,
        action: 'auth.login_failed',
        targetType: 'user',
        targetId: undefined,
        ipAddress,
        metadata: { email },
      });
      // Generic message — never confirm whether email exists
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokens = await this.issueTokens(user);

    await this.auditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: 'auth.login',
      targetType: 'user',
      targetId: user.id,
      ipAddress,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        languagePref: user.languagePref,
        themePref: user.themePref,
      },
    };
  }

  // ── Guest Login ────────────────────────────────────────────────────────────
  async guestLogin(
    role: string,
    ipAddress?: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: Partial<User>;
  }> {
    let user = await this.userRepo.findOne({
      where: { role: role as any, isActive: true },
    });

    if (!user) {
      user = this.userRepo.create({
        email: `guest_${Date.now()}@vels.edu`,
        passwordHash: await bcrypt.hash('guestpassword', 10),
        fullName: 'Guest Driver',
        role: role as any,
        isActive: true,
      });
      user = await this.userRepo.save(user);
    }

    const tokens = await this.issueTokens(user);

    await this.auditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: 'auth.guest_login',
      targetType: 'user',
      targetId: user.id,
      ipAddress,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        languagePref: user.languagePref,
        themePref: user.themePref,
      },
    };
  }

  // ── Refresh ────────────────────────────────────────────────────────────────
  async refresh(rawToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    // Find token by hash
    const tokenRecord = await this.findValidRefreshToken(rawToken);
    if (!tokenRecord) {
      throw new UnauthorizedException('Token invalid.');
    }

    const user = await this.userRepo.findOne({
      where: { id: tokenRecord.userId, isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException('Token invalid.');
    }

    // Rotate: revoke old, issue new
    await this.refreshTokenRepo.update(tokenRecord.id, { revoked: true });

    return this.issueTokens(user);
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async logout(rawToken: string, userId: string): Promise<void> {
    const tokenRecord = await this.findValidRefreshToken(rawToken);
    if (tokenRecord && tokenRecord.userId === userId) {
      await this.refreshTokenRepo.update(tokenRecord.id, { revoked: true });
    }
    // Silently succeed even if token not found — prevents probing
    await this.auditService.log({
      actorId: userId,
      action: 'auth.logout',
      targetType: 'user',
      targetId: userId,
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────
  private async issueTokens(user: User) {
    const accessTtl = this.configService.get<number>('jwt.accessTtlSeconds') || 900;
    const refreshTtlDays = this.configService.get<number>('jwt.refreshExpiresInDays') || 7;

    const payload = { sub: user.id, role: user.role, email: user.email };
    const access_token = this.jwtService.sign(payload, {
      expiresIn: accessTtl,
    });

    // Raw refresh token — a UUID stored as bcrypt hash
    const rawRefresh = uuidv4();
    const tokenHash = await bcrypt.hash(rawRefresh, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTtlDays);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({ userId: user.id, tokenHash, expiresAt }),
    );

    return { access_token, refresh_token: rawRefresh, expires_in: accessTtl };
  }

  private async findValidRefreshToken(
    rawToken: string,
  ): Promise<RefreshToken | null> {
    // We cannot query by hash directly (bcrypt is one-way), so we load
    // unexpired, unrevoked tokens for recent window and compare.
    // In practice, store a fast lookup: use first 8 chars as prefix index.
    // For simplicity here we rely on UUID uniqueness — compare all valid tokens.
    // Production optimisation: store a SHA-256 index alongside bcrypt hash.
    const candidates = await this.refreshTokenRepo.find({
      where: { revoked: false },
      order: { issuedAt: 'DESC' },
      take: 200, // bound the scan
    });

    for (const candidate of candidates) {
      if (new Date() > candidate.expiresAt) continue;
      const match = await bcrypt.compare(rawToken, candidate.tokenHash);
      if (match) {
        await this.refreshTokenRepo.update(candidate.id, {
          lastUsedAt: new Date(),
        });
        return candidate;
      }
    }
    return null;
  }
}
