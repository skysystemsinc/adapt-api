import { Controller, Get } from '@nestjs/common';
import { ApplicationTypeService } from './application-type.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApplicationTypeResponseDto } from './dto/application-type-response.dto';

@Controller('application-type')
export class ApplicationTypeController {
  constructor(private readonly applicationTypeService: ApplicationTypeService) {}

  @ApiOperation({ summary: 'Get all application types' })
  @ApiResponse({ status: 200, description: 'Get all application types', type: [ApplicationTypeResponseDto] })
  @Get()
  findAll(): Promise<ApplicationTypeResponseDto[]> {
    return this.applicationTypeService.findAll();
  }
}
