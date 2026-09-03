import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcryptjs';

interface AdminSessionPayload {
  role: 'admin';
  sub: 'single-admin';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(password: string): Promise<string> {
    const hash = this.configService.getOrThrow<string>('app.adminPasswordHash');
    const valid = await compare(password, hash);
    if (!valid) {
      throw new UnauthorizedException('管理员密码错误');
    }

    const payload: AdminSessionPayload = { role: 'admin', sub: 'single-admin' };
    return this.jwtService.signAsync(payload, { expiresIn: '8h' });
  }

  async verify(token: string): Promise<boolean> {
    try {
      const payload = await this.jwtService.verifyAsync<AdminSessionPayload>(token);
      return payload.role === 'admin' && payload.sub === 'single-admin';
    } catch {
      return false;
    }
  }
}
