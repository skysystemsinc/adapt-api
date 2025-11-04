import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RecaptchaVerificationResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly secretKey: string;
  private readonly verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  private readonly minimumScore = 0.5; // Adjust based on your needs (0.0 to 1.0)

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY') || '';
    if (!this.secretKey) {
      console.warn('RECAPTCHA_SECRET_KEY is not set. reCAPTCHA verification will be skipped.');
    }
  }

  async verifyToken(token: string, expectedAction: string = 'signin'): Promise<boolean> {
    if (!this.secretKey) {
      // If secret key is not configured, skip verification (for development)
      console.warn('reCAPTCHA verification skipped: Secret key not configured');
      return true;
    }

    if (!token) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    try {
      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: this.secretKey,
          response: token,
        }),
      });

      const data: RecaptchaVerificationResponse = await response.json();

      if (!data.success) {
        const errorCodes = data['error-codes'] || [];
        console.error('reCAPTCHA verification failed:', errorCodes);
        
        // Provide user-friendly error messages for common errors
        if (errorCodes.includes('timeout-or-duplicate')) {
          throw new BadRequestException(
            'reCAPTCHA token has expired or already been used. Please refresh the page and try again.'
          );
        }
        
        if (errorCodes.includes('invalid-input-response')) {
          throw new BadRequestException(
            'reCAPTCHA verification failed. Please refresh the page and try again.'
          );
        }
        
        throw new BadRequestException(
          `reCAPTCHA verification failed: ${errorCodes.join(', ')}`
        );
      }

      // Verify the action matches (for v3)
      if (expectedAction && data.action !== expectedAction) {
        console.error(
          `reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.action}`
        );
        throw new BadRequestException('reCAPTCHA action verification failed');
      }

      // Check the score (for v3, score ranges from 0.0 to 1.0)
      // Higher score = more likely a human, lower score = more likely a bot
      if (data.score !== undefined && data.score < this.minimumScore) {
        console.error(`reCAPTCHA score too low: ${data.score} (minimum: ${this.minimumScore})`);
        throw new BadRequestException(
          `reCAPTCHA verification failed: Score too low (${data.score.toFixed(2)})`
        );
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error verifying reCAPTCHA token:', error);
      throw new BadRequestException('Failed to verify reCAPTCHA token');
    }
  }
}

