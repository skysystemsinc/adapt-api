import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Res } from '@nestjs/common';
import { WarehouseLocationService } from './warehouse-location.service';
import { FacilityService } from './facility/facility.service';
import { HumanResourceService } from './human-resource/human-resource.service';
import { CreateWarehouseLocationDto } from './dto/create-warehouse-location.dto';
import { UpdateWarehouseLocationDto } from './dto/update-warehouse-location.dto';
import { CreateFacilityDto } from './facility/dto/create-facility.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Warehouse Location')
@Controller('warehouse-location')
export class WarehouseLocationController {
  constructor(
    private readonly warehouseLocationService: WarehouseLocationService,
    private readonly facilityService: FacilityService,
    private readonly humanResourceService: HumanResourceService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createWarehouseLocationDto: CreateWarehouseLocationDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.warehouseLocationService.create(createWarehouseLocationDto, userId);
  }

  @Get()
  findAll() {
    return this.warehouseLocationService.findAll();
  }

  @Get('my-applications')
  @UseGuards(JwtAuthGuard)
  async getMyApplications(@Request() req: any) {
    const userId = req.user.sub;
    return this.warehouseLocationService.findAllByUserId(userId);
  }

  @Get(':id/facility')
  @UseGuards(JwtAuthGuard)
  async getFacility(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.facilityService.findByWarehouseLocationId(id, userId);
  }

  @Post(':id/facility')
  @UseGuards(JwtAuthGuard)
  async createFacility(
    @Param('id') id: string,
    @Body() createFacilityDto: CreateFacilityDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.facilityService.create(id, createFacilityDto, userId);
  }

  @Patch(':id/facility')
  @UseGuards(JwtAuthGuard)
  async updateFacility(
    @Param('id') id: string,
    @Body() updateFacilityDto: CreateFacilityDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.facilityService.updateByWarehouseLocationId(id, updateFacilityDto, userId);
  }

  // These routes must come LAST - after all specific sub-routes
  // Otherwise they will catch requests like /:id/contact before the specific routes
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehouseLocationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWarehouseLocationDto: UpdateWarehouseLocationDto) {
    return this.warehouseLocationService.update(+id, updateWarehouseLocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehouseLocationService.remove(+id);
  }

  @Get('/documents/:id/download')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download warehouse location document' })
  @ApiResponse({ status: 200, description: 'Document downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadDocument(
    @Param('id') id: string,
    @Res() res: any,
  ) {
    const { buffer, mimeType, filename } = await this.humanResourceService.downloadWarehouseDocument(id);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Frame-Options', 'DENY');

    res.send(buffer);
  }
}
