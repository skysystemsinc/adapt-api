import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

/**
 * Rate limiting guard for forgot-password endpoint
 * Prevents abuse by limiting password reset requests per IP/email
 */
@Injectable()
export class ForgotPasswordRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(ForgotPasswordRateLimitGuard.name);
  private readonly requestCounts = new Map<string, { count: number; resetAt: number }>();

  // Rate limit configuration
  // Allow 3 requests per 10 minutes per IP/email to prevent abuse (maximum 3 attempts per 10 minutes)
  private readonly MAX_REQUESTS_PER_WINDOW = 3;
  private readonly WINDOW_MS = 10 * 60 * 1000; // 10 minutes window

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const identifier = this.getIdentifier(request);

    // Get or create request counter for this identifier
    const now = Date.now();
    let requestInfo = this.requestCounts.get(identifier);

    // Reset counter if window has expired
    if (!requestInfo || now > requestInfo.resetAt) {
      requestInfo = {
        count: 0,
        resetAt: now + this.WINDOW_MS,
      };
    }

    // Check if limit exceeded
    if (requestInfo.count >= this.MAX_REQUESTS_PER_WINDOW) {
      const waitTime = Math.ceil((requestInfo.resetAt - now) / 1000);
      this.logger.warn(
        `🚫 Rate limit exceeded for forgot-password: ${identifier}. Requests: ${requestInfo.count}/${this.MAX_REQUESTS_PER_WINDOW}`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many password reset requests. Please try again in ${waitTime} seconds.`,
          retryAfter: waitTime,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    requestInfo.count++;
    this.requestCounts.set(identifier, requestInfo);

    this.logger.debug(
      `✅ Forgot-password request allowed for ${identifier}. Count: ${requestInfo.count}/${this.MAX_REQUESTS_PER_WINDOW}`,
    );

    return true;
  }

  /**
   * Get unique identifier for rate limiting
   * Uses email from request body if available, otherwise IP address
   */
  private getIdentifier(request: any): string {
    // Try to get email from request body (for more accurate rate limiting)
    const email = request.body?.email;
    if (email) {
      return `email:${email.toLowerCase()}`;
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
    for (const [key, value] of this.requestCounts.entries()) {
      if (now > value.resetAt) {
        this.requestCounts.delete(key);
      }
    }
  }
}

