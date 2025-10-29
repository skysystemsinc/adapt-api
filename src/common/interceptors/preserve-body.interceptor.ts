import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Interceptor to preserve raw request body before global ValidationPipe processes it
 * This is needed for routes where the global pipe might strip properties
 */
@Injectable()
export class PreserveBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Store raw body (before any pipes process it)
    if (request.body && !request.__rawBody) {
      request.__rawBody = JSON.parse(JSON.stringify(request.body));
    }

    return next.handle();
  }
}

