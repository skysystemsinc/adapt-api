import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { WarehouseLocationAdminService } from './warehouse-location-admin.service';
import { QueryLocationApplicationDto } from './dto/query-location-application.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Warehouse Location Admin')
@Controller('warehouse-location-admin')
export class WarehouseLocationAdminController {
  constructor(private readonly warehouseLocationAdminService: WarehouseLocationAdminService) {}

  @Get('/applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all warehouse location applications with pagination' })
  findAllWarehouseLocations(@Query() query: QueryLocationApplicationDto) {
    return this.warehouseLocationAdminService.findAllWarehouseLocationsPaginated(query);
  }

  @Get('/applications/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a single warehouse location application by ID' })
  findOneWarehouseLocation(@Param('id') id: string) {
    return this.warehouseLocationAdminService.findOne(id);
  }
}

