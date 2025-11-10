import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateBankDetailsDto, CreateWarehouseOperatorApplicationRequestDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/entities/user.entity';
import { UpdateBankDetailsDto } from './dto/create-bank-details.dto';

@ApiTags('Warehouse')
@ApiBearerAuth('JWT-auth')
@Controller('warehouse')
@UseGuards(JwtAuthGuard)
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly authService: AuthService
  ) { }

  @ApiOperation({ summary: 'Create a new warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateWarehouseOperatorApplicationRequestDto })
  @Post('/operator/application')
  createOperatorApplication(
    @Body() createWarehouseDto: CreateWarehouseOperatorApplicationRequestDto,
    @Request() request: any
  ) {
    const user = request.user as User;
    return this.warehouseService.createOperatorApplication(createWarehouseDto, user.id);
  }

  @ApiOperation({ summary: 'Create a new bank details for a warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateBankDetailsDto })
  @Post('/operator/application/:applicationId/bank-details')
  createBankDetails(
    @Param('applicationId') applicationId: string,
    @Body() createBankDetailsDto: CreateBankDetailsDto,
    @Request() request: any
  ) {
    const user = request.user as User;
    return this.warehouseService.createBankDetails(applicationId, createBankDetailsDto, user.id);
  }

  @ApiOperation({ summary: 'Update a bank details for a warehouse operator application' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: UpdateBankDetailsDto })
  @Patch('/operator/application/:applicationId/bank-details/:bankDetailsId')
  updateBankDetails(
    @Param('applicationId') applicationId: string,
    @Param('bankDetailsId') bankDetailsId: string,
    @Body() updateBankDetailsDto: UpdateBankDetailsDto,
    @Request() request: any
  ) {
    const user = request.user as User;
    return this.warehouseService.updateBankDetails(applicationId, bankDetailsId, updateBankDetailsDto, user.id);
  }

  @Get()
  findAll() {
    return this.warehouseService.findAll();
  }

  @Get('/operator')
  findOneWarehouseOperator(@Request() request: any) {
    const user = request.user as User;
    return this.warehouseService.findOneWarehouseOperator(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehouseService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWarehouseDto: UpdateWarehouseDto) {
    return this.warehouseService.update(+id, updateWarehouseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.warehouseService.remove(+id);
  }
}
