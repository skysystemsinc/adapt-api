import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RoleRequestsService } from '../services/role-requests.service';
import { CreateRoleRequestDto } from '../dto/create-role-request.dto';
import { ReviewRoleRequestDto } from '../dto/review-role-request.dto';
import { RoleRequestResponseDto } from '../dto/role-request-response.dto';
import { QueryRoleRequestsDto } from '../dto/query-role-requests.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permissions } from '../constants/permissions.constants';

@ApiTags('Role Requests')
@Controller('admin/rbac/role-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permissions.MANAGE_ROLE_REQUESTS)
export class RoleRequestsController {
  constructor(private readonly roleRequestsService: RoleRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a role request for approval' })
  @ApiBody({ type: CreateRoleRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Role request created successfully',
    type: RoleRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async create(
    @Body() createRoleRequestDto: CreateRoleRequestDto,
    @Request() req: any,
  ): Promise<RoleRequestResponseDto> {
    const requestedBy = req.user?.id;
    return this.roleRequestsService.create(createRoleRequestDto, requestedBy);
  }

  @Get()
  @ApiOperation({ summary: 'Get all role requests with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of role requests',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/RoleRequestResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(
    @Query() query: QueryRoleRequestsDto,
  ): Promise<{
    data: RoleRequestResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.roleRequestsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role request by ID' })
  @ApiParam({ name: 'id', description: 'Role Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Role request details',
    type: RoleRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role request not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoleRequestResponseDto> {
    return this.roleRequestsService.findOne(id);
  }

  @Put(':id/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review (approve/reject) a role request' })
  @ApiParam({ name: 'id', description: 'Role Request ID (UUID)' })
  @ApiBody({ type: ReviewRoleRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Role request reviewed successfully',
    type: RoleRequestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role request not found' })
  @ApiResponse({ status: 400, description: 'Request already reviewed' })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: ReviewRoleRequestDto,
    @Request() req: any,
  ): Promise<RoleRequestResponseDto> {
    const reviewedBy = req.user?.id;
    return this.roleRequestsService.review(id, reviewDto, reviewedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a role request' })
  @ApiParam({ name: 'id', description: 'Role Request ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Role request deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Role request not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.roleRequestsService.remove(id);
  }
}

