import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { QueryUsersDto, UserTypeFilter } from './dto/query-users.dto';
import { PaginatedUsersResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { Permissions } from '../rbac/constants/permissions.constants';
import { User } from './entities/user.entity';

@ApiTags('Admin - Users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(Permissions.VIEW_USERS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiQuery({
    name: 'type',
    enum: UserTypeFilter,
    required: false,
    description: 'Filter by user type: applicant or internal-users',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users',
    type: PaginatedUsersResponseDto,
  })
  async findAll(@Query() query: QueryUsersDto): Promise<PaginatedUsersResponseDto> {
    return await this.usersService.findAllPaginated(query);
  }

  @Get('internal/:id')
  @RequirePermissions(Permissions.VIEW_USERS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({
    status: 200,
    description: 'User',
    type: User,
  })
  async findOne(@Param('id') id: string): Promise<User | null> {
    return await this.usersService.findOne(id);
  }
}

