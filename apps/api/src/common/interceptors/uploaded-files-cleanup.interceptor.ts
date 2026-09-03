import fs from 'node:fs';

import type { Request } from 'express';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { catchError, throwError } from 'rxjs';

type UploadedGroups = Record<string, Express.Multer.File[]>;

@Injectable()
export class UploadedFilesCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { files?: UploadedGroups }>();
    return next.handle().pipe(
      catchError((error: unknown) => {
        const files = Object.values(request.files ?? {}).flat();
        files.forEach((file) => fs.rmSync(file.path, { force: true }));
        return throwError(() => error);
      }),
    );
  }
}
