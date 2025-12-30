import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RBACService } from '../rbac/services/rbac.service';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Permissions } from '../rbac/constants/permissions.constants';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rbacService: RBACService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions(Permissions.CREATE_USERS)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all users' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }
  
  @Get('internal')
  @RequirePermissions(Permissions.VIEW_USERS)
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth('JWT-auth')
  async findAllInternal(): Promise<any> {
    const users = await this.usersService.findAllInternal();
    return users;
  }

  @Get('hod')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all HOD users (requires authentication only, no specific permission)' })
  @HttpCode(HttpStatus.OK)
  async findHodUsers(): Promise<User[]> {
    return this.usersService.findHodUsers();
  }

  @Get('me/permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  async getMyPermissions(@Request() req: any): Promise<{ permissions: string[] }> {
    const userId = req.user.sub;
    const permissions = await this.rbacService.getUserPermissionNames(userId);
    return { permissions };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }
}
