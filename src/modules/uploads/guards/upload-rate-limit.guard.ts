import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

/**
 * Rate limiting guard for file uploads
 * Prevents abuse by limiting uploads per IP/user
 */
@Injectable()
export class UploadRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(UploadRateLimitGuard.name);
  private readonly uploadCounts = new Map<string, { count: number; resetAt: number }>();
  
  // Rate limit configuration
  private readonly MAX_UPLOADS_PER_WINDOW = 10; // Max uploads per time window
  private readonly WINDOW_MS = 60 * 1000; // 1 minute window

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const identifier = this.getIdentifier(request);

    // Get or create upload counter for this identifier
    const now = Date.now();
    let uploadInfo = this.uploadCounts.get(identifier);

    // Reset counter if window has expired
    if (!uploadInfo || now > uploadInfo.resetAt) {
      uploadInfo = {
        count: 0,
        resetAt: now + this.WINDOW_MS,
      };
    }

    // Check if limit exceeded
    if (uploadInfo.count >= this.MAX_UPLOADS_PER_WINDOW) {
      const waitTime = Math.ceil((uploadInfo.resetAt - now) / 1000);
      this.logger.warn(
        `🚫 Rate limit exceeded for ${identifier}. Uploads: ${uploadInfo.count}/${this.MAX_UPLOADS_PER_WINDOW}`,
      );
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many upload requests. Please try again in ${waitTime} seconds.`,
          retryAfter: waitTime,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    uploadInfo.count++;
    this.uploadCounts.set(identifier, uploadInfo);

    this.logger.debug(
      `✅ Upload allowed for ${identifier}. Count: ${uploadInfo.count}/${this.MAX_UPLOADS_PER_WINDOW}`,
    );

    return true;
  }

  /**
   * Get unique identifier for rate limiting
   * Uses user ID if authenticated, otherwise IP address
   */
  private getIdentifier(request: any): string {
    // Try to get user ID from request (if authenticated)
    const userId = request.user?.id || request.body?.userId;
    if (userId) {
      return `user:${userId}`;
    }

    // Fall back to IP address
    const ip =
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown';

    return `ip:${ip}`;
  }

  /**
   * Cleanup expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.uploadCounts.entries()) {
      if (now > value.resetAt) {
        this.uploadCounts.delete(key);
      }
    }
  }
}

