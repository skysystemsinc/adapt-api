import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export class SoftValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      skipMissingProperties: false,
      ...options,
    });
  }
}
