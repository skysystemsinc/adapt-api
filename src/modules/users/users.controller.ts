import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RBACService } from '../rbac/services/rbac.service';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Permissions } from '../rbac/constants/permissions.constants';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rbacService: RBACService,
  ) {}

  @Post()
  // @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }
  
  @Get('internal')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permissions.VIEW_USERS)
  @HttpCode(HttpStatus.OK)
  async findAllInternal(): Promise<any> {
    const users = await this.usersService.findAllInternal();
    return users;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }

  @Get('me/permissions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyPermissions(@Request() req: any): Promise<{ permissions: string[] }> {
    const userId = req.user.sub;
    const permissions = await this.rbacService.getUserPermissionNames(userId);
    return { permissions };
  }
}
