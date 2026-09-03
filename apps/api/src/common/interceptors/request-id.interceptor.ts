import { randomUUID } from 'node:crypto';

import type { Request, Response } from 'express';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId = request.header('x-request-id')?.slice(0, 100) || randomUUID();

    response.setHeader('x-request-id', requestId);
    Object.assign(request, { requestId });

    return next.handle();
  }
}
