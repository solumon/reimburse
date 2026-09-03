import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class MultipartJsonPipe implements PipeTransform<string, unknown> {
  transform(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException('multipart JSON 字段格式无效');
    }
  }
}
