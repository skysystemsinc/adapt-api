import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DynamicCalculatorService } from './dynamic-calculator.service';
import { CreateDynamicCalculatorDto } from './dto/create-dynamic-calculator.dto';
import { UpdateDynamicCalculatorDto } from './dto/update-dynamic-calculator.dto';
import { DynamicCalculator } from './entities/dynamic-calculator.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../rbac/constants/permissions.constants';

@ApiTags('Admin - Dynamic Calculator')
@Controller('admin/dynamic-calculator')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class DynamicCalculatorAdminController {
  constructor(private readonly dynamicCalculatorService: DynamicCalculatorService) {}

  @Post()
  @RequirePermissions(Permissions.MANAGE_CALCULATOR)
  @ApiOperation({ summary: 'Create a new dynamic calculator configuration' })
  @ApiBody({ type: CreateDynamicCalculatorDto })
  @ApiResponse({ status: 201, description: 'Dynamic calculator created', type: DynamicCalculator })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateDynamicCalculatorDto): Promise<DynamicCalculator> {
    return this.dynamicCalculatorService.create(createDto);
  }

  @Get()
  @RequirePermissions(Permissions.MANAGE_CALCULATOR)
  @ApiOperation({ summary: 'Get all dynamic calculator configurations' })
  @ApiResponse({ status: 200, description: 'List of dynamic calculators', type: [DynamicCalculator] })
  async findAll(): Promise<DynamicCalculator[]> {
    return this.dynamicCalculatorService.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permissions.MANAGE_CALCULATOR)
  @ApiOperation({ summary: 'Get a dynamic calculator configuration by ID' })
  @ApiParam({ name: 'id', description: 'Dynamic calculator ID' })
  @ApiResponse({ status: 200, description: 'Dynamic calculator found', type: DynamicCalculator })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DynamicCalculator> {
    return this.dynamicCalculatorService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.MANAGE_CALCULATOR)
  @ApiOperation({ summary: 'Update a dynamic calculator configuration' })
  @ApiParam({ name: 'id', description: 'Dynamic calculator ID' })
  @ApiBody({ type: UpdateDynamicCalculatorDto })
  @ApiResponse({ status: 200, description: 'Dynamic calculator updated', type: DynamicCalculator })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateDynamicCalculatorDto,
  ): Promise<DynamicCalculator> {
    return this.dynamicCalculatorService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.MANAGE_CALCULATOR)
  @ApiOperation({ summary: 'Delete a dynamic calculator configuration' })
  @ApiParam({ name: 'id', description: 'Dynamic calculator ID' })
  @ApiResponse({ status: 204, description: 'Dynamic calculator deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.dynamicCalculatorService.remove(id);
  }
}

