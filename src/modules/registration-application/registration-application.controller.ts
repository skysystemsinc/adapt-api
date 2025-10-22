import { Controller, Get, Post, Body, Param, Put, Delete, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RegistrationApplicationService } from './registration-application.service';
import { RegistrationApplication } from './entities/registration-application.entity';
import { CreateRegistrationApplicationDto } from './dto/create-registration-application.dto';

@Controller('registration-application')
export class RegistrationApplicationController {
  constructor(private readonly registrationApplicationService: RegistrationApplicationService) {}

  @Get()
  findAll() {
    return this.registrationApplicationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registrationApplicationService.findOne(id);
  }

  @Post()
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

  private getClientIp(request: Request): string {
    // Try to get real IP from various headers (for proxies/load balancers)
    const forwarded = request.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<RegistrationApplication>) {
    return this.registrationApplicationService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registrationApplicationService.remove(id);
  }
}

