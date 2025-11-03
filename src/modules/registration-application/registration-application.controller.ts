import { Controller, Get, Post, Body, Param, Put, Delete, Req, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RegistrationApplicationService } from './registration-application.service';
import { RegistrationApplication } from './entities/registration-application.entity';
import { CreateRegistrationApplicationDto } from './dto/create-registration-application.dto';
import { SubmitRegistrationDto } from './dto/submit-registration.dto';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Permissions } from '../rbac/constants/permissions.constants';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RegistrationResponseDto } from './dto/registration-response.dto';

@Controller()
// @UseGuards(JwtAuthGuard)
export class RegistrationApplicationController {
  constructor(private readonly registrationApplicationService: RegistrationApplicationService) {}

  @Get('registration-application')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permissions.VIEW_KYC)
  findAll() {
    return this.registrationApplicationService.findAll();
  }

  @Get('registration-application/:id')
  findOne(@Param('id') id: string) {
    return this.registrationApplicationService.findOne(id);
  }

  @Post('registration-application')
  create(@Body() data: CreateRegistrationApplicationDto, @Req() request: Request) {
    // Automatically extract metadata from request
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];
    const referrer = request.headers['referer'] || request.headers['referrer'];
    
    return this.registrationApplicationService.create(data, {
      ipAddress,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
      referrer: Array.isArray(referrer) ? referrer[0] : referrer,
    });
  }

  @Post('registration-applications')
  @HttpCode(HttpStatus.CREATED)
  async submitRegistration(
    @Body() dto: SubmitRegistrationDto,
    @Req() request: Request,
  ): Promise<RegistrationResponseDto> {
    // Extract metadata from request
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || 'unknown';
    const referrer = (request.headers['referer'] || request.headers['referrer'] || null) as string | null;

    return this.registrationApplicationService.submitRegistration(
      dto,
      ipAddress,
      Array.isArray(userAgent) ? userAgent[0] : userAgent,
      referrer || undefined,
    );
  }

  private getClientIp(request: Request): string {
    // Try to get real IP from various headers (for proxies/load balancers)
    const forwarded = request.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  @Put('registration-application/:id')
  update(@Param('id') id: string, @Body() data: Partial<RegistrationApplication>) {
    return this.registrationApplicationService.update(id, data);
  }

  @Delete('registration-application/:id')
  remove(@Param('id') id: string) {
    return this.registrationApplicationService.remove(id);
  }
}

