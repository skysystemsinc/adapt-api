import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { WeighingsService } from './weighings.service';
import { CreateWeighingDto } from './dto/create-weighing.dto';
import { UpdateWeighingDto } from './dto/update-weighing.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('warehouse-location')
export class WeighingsController {
  constructor(private readonly weighingsService: WeighingsService) {}

  // Warehouse Location Weighing endpoints
  @Get(':id/weighing')
  @UseGuards(JwtAuthGuard)
  async getWeighing(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.weighingsService.findByWarehouseLocationId(id, userId);
  }

  @Post(':id/weighing')
  @UseGuards(JwtAuthGuard)
  async createWeighing(
    @Param('id') id: string,
    @Body() createWeighingDto: CreateWeighingDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.weighingsService.create(id, createWeighingDto, userId);
  }

  @Patch(':id/weighing')
  @UseGuards(JwtAuthGuard)
  async updateWeighing(
    @Param('id') id: string,
    @Body() updateWeighingDto: CreateWeighingDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.weighingsService.updateByWarehouseLocationId(id, updateWeighingDto, userId);
  }

  // Legacy endpoints (kept for backward compatibility)
  @Post('weighings')
  create(@Body() createWeighingDto: CreateWeighingDto) {
    return this.weighingsService.create('', createWeighingDto, '');
  }

  @Get('weighings')
  findAll() {
    return this.weighingsService.findAll();
  }

  @Get('weighings/:id')
  findOne(@Param('id') id: string) {
    return this.weighingsService.findOne(+id);
  }

  @Patch('weighings/:id')
  update(@Param('id') id: string, @Body() updateWeighingDto: UpdateWeighingDto) {
    return this.weighingsService.update(+id, updateWeighingDto);
  }

  @Delete('weighings/:id')
  remove(@Param('id') id: string) {
    return this.weighingsService.remove(+id);
  }
}
