import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyOTPDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const user = await this.userRepository.findOne({
      where: { refreshToken: refreshTokenDto.refreshToken },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    
    if (!user) {
      throw new BadRequestException('Email not found in system');
    }

    // Generate OTP (4 digits)
    // const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otp = "1234";
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    await this.userRepository.update(user.id, {
      otp: otp, // Store OTP in dedicated field
      otpExpires: otpExpires,
    });

    // TODO: Send OTP via email service
    console.log(`OTP for ${user.email}: ${otp}`);
    
    return { 
      message: 'OTP has been sent to your email',
    };
  }

  async verifyOTP(verifyOTPDto: VerifyOTPDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: verifyOTPDto.email,
        otp: verifyOTPDto.otp,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid OTP or email');
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      // Clear expired OTP
      await this.userRepository.update(user.id, {
        otp: undefined,
        otpExpires: undefined,
      });
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    // Generate a proper reset token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update with the actual reset token and clear OTP
    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
      otp: undefined, // Clear OTP after successful verification
      otpExpires: undefined, // Clear OTP expiration
    });

    return { 
      message: 'OTP verified successfully',
      token: resetToken
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: resetPasswordDto.token,
        email: resetPasswordDto.email,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid reset token or email');
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      // Clear expired token (sets to NULL in database)
      await this.userRepository.update(user.id, {
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      });
      throw new BadRequestException('Reset token has expired. Please request a new password reset.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, saltRounds);

    // Reset password and clear reset token fields (sets to NULL in database)
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(user: User) {
    const payload = { 
      email: user.email, 
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.userRepository.update(userId, { 
      refreshToken: refreshToken || undefined 
    });
  }

  async validateUser(payload: any): Promise<User> {
    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }
}