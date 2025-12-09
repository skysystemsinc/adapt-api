import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignPermissionsToRoleDto } from '../dto/assign-permissions-to-role.dto';
import { RoleResponseDto } from '../dto/role-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permissions } from '../constants/permissions.constants';

@Controller('admin/rbac/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permissions.MANAGE_RBAC)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoleDto: CreateRoleDto, @Request() req: any): Promise<any> {
    const requestedBy = req.user?.id;
    return this.rolesService.create(createRoleDto, requestedBy);
  }

  @Get()
  async findAll(): Promise<RoleResponseDto[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RoleResponseDto> {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @Request() req: any): Promise<any> {
    const requestedBy = req.user?.id;
    return this.rolesService.update(id, updateRoleDto, requestedBy);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsToRoleDto,
    @Request() req: any,
  ): Promise<any> {
    const requestedBy = req.user?.id;
    return this.rolesService.assignPermissions(id, assignPermissionsDto, requestedBy);
  }

  @Delete(':id/permissions/:permissionId')
  async removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @Request() req: any,
  ): Promise<any> {
    const requestedBy = req.user?.id;
    return this.rolesService.removePermission(id, permissionId, requestedBy);
  }
}

