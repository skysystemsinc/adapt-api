import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JurisdictionService } from './jurisdiction.service';
import { CreateJurisdictionDto } from './dto/create-jurisdiction.dto';
import { UpdateJurisdictionDto } from './dto/update-jurisdiction.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('warehouse-location')
export class JurisdictionController {
  constructor(private readonly jurisdictionService: JurisdictionService) {}

  // Warehouse Location Jurisdiction endpoints
  @Get(':id/jurisdiction')
  @UseGuards(JwtAuthGuard)
  async getJurisdiction(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.jurisdictionService.findByWarehouseLocationId(id, userId);
  }

  @Post(':id/jurisdiction')
  @UseGuards(JwtAuthGuard)
  async createJurisdiction(
    @Param('id') id: string,
    @Body() createJurisdictionDto: CreateJurisdictionDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.jurisdictionService.create(id, createJurisdictionDto, userId);
  }

  @Patch(':id/jurisdiction')
  @UseGuards(JwtAuthGuard)
  async updateJurisdiction(
    @Param('id') id: string,
    @Body() updateJurisdictionDto: CreateJurisdictionDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.jurisdictionService.updateByWarehouseLocationId(id, updateJurisdictionDto, userId);
  }

  // Legacy endpoints (kept for backward compatibility)
  @Post('jurisdiction')
  create(@Body() createJurisdictionDto: CreateJurisdictionDto) {
    return this.jurisdictionService.create('', createJurisdictionDto, '');
  }

  @Get('jurisdiction')
  findAll() {
    return this.jurisdictionService.findAll();
  }

  @Get('jurisdiction/:id')
  findOne(@Param('id') id: string) {
    return this.jurisdictionService.findOne(+id);
  }

  @Patch('jurisdiction/:id')
  update(@Param('id') id: string, @Body() updateJurisdictionDto: UpdateJurisdictionDto) {
    return this.jurisdictionService.update(+id, updateJurisdictionDto);
  }

  @Delete('jurisdiction/:id')
  remove(@Param('id') id: string) {
    return this.jurisdictionService.remove(+id);
  }
}
