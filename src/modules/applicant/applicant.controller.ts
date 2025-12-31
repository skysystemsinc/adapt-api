import { Controller, Get, UseGuards, Request, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApplicantService } from './applicant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Get paginated applications list' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getApplications(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.sub || req.user.id;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.applicantService.getApplications(userId, pageNum, limitNum);
  }

  @Get('certificate')
  @ApiOperation({ summary: 'Get applicant application' })
  @ApiResponse({ status: 200, description: 'Application retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getApplication(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.applicantService.getCertificate(userId);
  }

}
