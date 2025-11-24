import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Query } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Organization } from './entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ListOrganizationDto, ListOrganizationResponseDto, OrganizationDto } from './dto/list-organization.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Organization')
@ApiExtraModels(OrganizationDto, ListOrganizationResponseDto)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  @ApiOperation({ summary: 'Create a new organization' })
  @ApiBody({ type: CreateOrganizationDto })
  @Post()
  create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @Request() req: any): Promise<Organization> {
    const user = req.user as User;
    return this.organizationService.create(createOrganizationDto, user.id);
  }

  @Get('list')
  @ApiOperation({ summary: 'Get all organizations' })
  async findAllTest(
    @Query() query?: ListOrganizationDto,
  ): Promise<ListOrganizationResponseDto> {
    return await this.organizationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an organization by ID' })
  async findOne(
    @Param('id') id: string,
  ): Promise<Organization> {
    return await this.organizationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an organization by ID' })
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @Request() req: any,
  ): Promise<Organization> {
    const user = req.user as User;
    return await this.organizationService.update(id, updateOrganizationDto, user.id);
  }
}
