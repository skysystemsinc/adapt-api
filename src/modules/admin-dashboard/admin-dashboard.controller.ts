import { Controller, Get, Param } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @ApiOperation({ summary: 'Get all admin dashboard data' })
  @ApiResponse({ status: 200, description: 'Get all admin dashboard data' })
  @Get()
  findAll() {
    return this.adminDashboardService.findAll();
  }

  @ApiOperation({ summary: 'Get admin dashboard data by id' })
  @ApiResponse({ status: 200, description: 'Get admin dashboard data by id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminDashboardService.findOne(id);
  }
}

