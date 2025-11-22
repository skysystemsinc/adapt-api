import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SecurityService } from './security.service';
import { CreateSecurityDto } from './dto/create-security.dto';
import { UpdateSecurityDto } from './dto/update-security.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('warehouse-location')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // Warehouse Location Security endpoints
  @Get(':id/security')
  @UseGuards(JwtAuthGuard)
  async getSecurity(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.securityService.findByWarehouseLocationId(id, userId);
  }

  @Post(':id/security')
  @UseGuards(JwtAuthGuard)
  async createSecurity(
    @Param('id') id: string,
    @Body() createSecurityDto: CreateSecurityDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.securityService.create(id, createSecurityDto, userId);
  }

  @Patch(':id/security')
  @UseGuards(JwtAuthGuard)
  async updateSecurity(
    @Param('id') id: string,
    @Body() updateSecurityDto: CreateSecurityDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.securityService.updateByWarehouseLocationId(id, updateSecurityDto, userId);
  }

  // Legacy endpoints (kept for backward compatibility)
  @Post('security')
  create(@Body() createSecurityDto: CreateSecurityDto) {
    return this.securityService.create('', createSecurityDto, '');
  }

  @Get('security')
  findAll() {
    return this.securityService.findAll();
  }

  @Get('security/:id')
  findOne(@Param('id') id: string) {
    return this.securityService.findOne(+id);
  }

  @Patch('security/:id')
  update(@Param('id') id: string, @Body() updateSecurityDto: UpdateSecurityDto) {
    return this.securityService.update(+id, updateSecurityDto);
  }

  @Delete('security/:id')
  remove(@Param('id') id: string) {
    return this.securityService.remove(+id);
  }
}
