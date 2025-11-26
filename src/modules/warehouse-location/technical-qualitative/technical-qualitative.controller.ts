import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TechnicalQualitativeService } from './technical-qualitative.service';
import { CreateTechnicalQualitativeDto } from './dto/create-technical-qualitative.dto';
import { UpdateTechnicalQualitativeDto } from './dto/update-technical-qualitative.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('warehouse-location')
@ApiTags('Warehouse Location - Technical Qualitative')
export class TechnicalQualitativeController {
  constructor(private readonly technicalQualitativeService: TechnicalQualitativeService) {}

  @Get(':id/technical-qualitative')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get technical qualitative information by warehouse location ID' })
  async getTechnicalQualitative(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.technicalQualitativeService.findByWarehouseLocationId(id, userId);
  }

  @Post(':id/technical-qualitative')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create or update technical qualitative information' })
  async createTechnicalQualitative(
    @Param('id') id: string,
    @Body() createTechnicalQualitativeDto: CreateTechnicalQualitativeDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.technicalQualitativeService.create(id, createTechnicalQualitativeDto, userId);
  }

  @Patch(':id/technical-qualitative')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update technical qualitative information' })
  async updateTechnicalQualitative(
    @Param('id') id: string,
    @Body() updateTechnicalQualitativeDto: UpdateTechnicalQualitativeDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.technicalQualitativeService.updateByWarehouseLocationId(id, updateTechnicalQualitativeDto, userId);
  }
}

