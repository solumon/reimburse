import type { Request, Response } from 'express';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RATE_LIMIT_KEY, type RateLimitOptions } from '../decorators/rate-limit.decorator.js';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const DEFAULT_RATE_LIMIT: RateLimitOptions = { limit: 120, ttl: 60_000 };

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private lastCleanupAt = Date.now();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? DEFAULT_RATE_LIMIT;
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const now = Date.now();
    this.cleanupExpiredBuckets(now);

    const tracker = request.ip || request.socket.remoteAddress || 'unknown';
    const route = `${context.getClass().name}:${context.getHandler().name}`;
    const key = `${route}:${tracker}`;
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      const resetAt = now + options.ttl;
      this.buckets.set(key, { count: 1, resetAt });
      this.setHeaders(response, options.limit, options.limit - 1, resetAt);
      return true;
    }

    if (bucket.count >= options.limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      this.setHeaders(response, options.limit, 0, bucket.resetAt);
      response.setHeader('Retry-After', retryAfter);
      throw new HttpException('请求过于频繁，请稍后重试', HttpStatus.TOO_MANY_REQUESTS);
    }

    bucket.count += 1;
    this.setHeaders(response, options.limit, options.limit - bucket.count, bucket.resetAt);
    return true;
  }

  private cleanupExpiredBuckets(now: number): void {
    if (now - this.lastCleanupAt < DEFAULT_RATE_LIMIT.ttl) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    this.lastCleanupAt = now;
  }

  private setHeaders(response: Response, limit: number, remaining: number, resetAt: number): void {
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
    response.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));
  }
}
