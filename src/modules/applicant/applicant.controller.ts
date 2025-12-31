import { Controller, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApplicantService } from './applicant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Applicant')
@ApiBearerAuth('JWT-auth')
@Controller('applicant')
@UseGuards(JwtAuthGuard)
export class ApplicantController {
  constructor(private readonly applicantService: ApplicantService) { }

  @Get('stats')
  @ApiOperation({ summary: 'Get applicant statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getStats(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.applicantService.getStats(userId);
  }

  @Get('applications')
  @ApiOperation({ summary: 'Get applicant application' })
  @ApiResponse({ status: 200, description: 'Application retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getApplication(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.applicantService.getApplication(userId);
  }
}
