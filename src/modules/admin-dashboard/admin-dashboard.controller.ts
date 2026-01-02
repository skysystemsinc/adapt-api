import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @ApiOperation({ summary: 'Get all admin dashboard data' })
  @ApiResponse({ status: 200, description: 'Get all admin dashboard data' })
  @Get()
  findAll() {
    return this.adminDashboardService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get all applicant statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getStats() {
    return this.adminDashboardService.getStats();
  }

  @Get('applications')
  @ApiOperation({ summary: 'Get all paginated applications list' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getApplications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminDashboardService.getApplications(pageNum, limitNum);
  }

  @Get('certificates')
  @ApiOperation({ summary: 'Get all certificates' })
  @ApiResponse({ status: 200, description: 'Certificates retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getCertificates() {
    return this.adminDashboardService.getCertificates();
  }

  @ApiOperation({ summary: 'Get admin dashboard data by id' })
  @ApiResponse({ status: 200, description: 'Get admin dashboard data by id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminDashboardService.findOne(id);
  }
}

