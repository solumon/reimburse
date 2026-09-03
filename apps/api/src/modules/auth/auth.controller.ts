import type { CookieOptions, Request, Response } from 'express';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthSession } from '@reimburse/shared';

import { Public } from '../../common/decorators/public.decorator.js';
import { RateLimit } from '../../common/decorators/rate-limit.decorator.js';
import { ApiErrorResponseDto, AuthSessionResponseDto } from '../../common/swagger/api-response.dto.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

const SESSION_COOKIE = 'reimburse_admin_session';
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;

@Controller({ path: 'auth', version: '1' })
@ApiTags('认证')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({ limit: 5, ttl: 60_000 })
  @ApiOperation({ summary: '管理员登录' })
  @ApiBody({ type: LoginDto })
  @ApiNoContentResponse({ description: '登录成功，写入管理员会话 Cookie' })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ApiErrorResponseDto })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token = await this.authService.login(dto.password);
    response.cookie(SESSION_COOKIE, token, this.cookieOptions(SESSION_MAX_AGE));
  }

  @Public()
  @Get('session')
  @ApiOperation({ summary: '查询当前登录状态' })
  @ApiOkResponse({ type: AuthSessionResponseDto })
  async session(@Req() request: Request): Promise<AuthSession> {
    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    return { authenticated: token ? await this.authService.verify(token) : false };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '退出管理员登录' })
  @ApiNoContentResponse({ description: '会话 Cookie 已清除' })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(SESSION_COOKIE, this.cookieOptions(0));
  }

  private cookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      maxAge,
      path: '/',
      sameSite: 'strict',
      secure: this.configService.getOrThrow<boolean>('app.cookieSecure'),
    };
  }
}
