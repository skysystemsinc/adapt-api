import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FireSafetyService } from './fire-safety.service';
import { CreateFireSafetyDto } from './dto/create-fire-safety.dto';
import { UpdateFireSafetyDto } from './dto/update-fire-safety.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('warehouse-location')
export class FireSafetyController {
  constructor(private readonly fireSafetyService: FireSafetyService) {}

  // Warehouse Location Fire Safety endpoints
  @Get(':id/fire-safety')
  @UseGuards(JwtAuthGuard)
  async getFireSafety(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.fireSafetyService.findByWarehouseLocationId(id, userId);
  }

  @Post(':id/fire-safety')
  @UseGuards(JwtAuthGuard)
  async createFireSafety(
    @Param('id') id: string,
    @Body() createFireSafetyDto: CreateFireSafetyDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.fireSafetyService.create(id, createFireSafetyDto, userId);
  }

  @Patch(':id/fire-safety')
  @UseGuards(JwtAuthGuard)
  async updateFireSafety(
    @Param('id') id: string,
    @Body() updateFireSafetyDto: CreateFireSafetyDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.fireSafetyService.updateByWarehouseLocationId(id, updateFireSafetyDto, userId);
  }

  // Legacy endpoints (kept for backward compatibility)
  @Post('fire-safety')
  create(@Body() createFireSafetyDto: CreateFireSafetyDto) {
    return this.fireSafetyService.create('', createFireSafetyDto, '');
  }

  @Get('fire-safety')
  findAll() {
    return this.fireSafetyService.findAll();
  }

  @Get('fire-safety/:id')
  findOne(@Param('id') id: string) {
    return this.fireSafetyService.findOne(+id);
  }

  @Patch('fire-safety/:id')
  update(@Param('id') id: string, @Body() updateFireSafetyDto: UpdateFireSafetyDto) {
    return this.fireSafetyService.update(+id, updateFireSafetyDto);
  }

  @Delete('fire-safety/:id')
  remove(@Param('id') id: string) {
    return this.fireSafetyService.remove(+id);
  }
}
