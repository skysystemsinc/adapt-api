import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RBACService } from '../services/rbac.service';
import { AssignRolesToUserDto } from '../dto/assign-roles-to-user.dto';
import { UserRoleResponseDto } from '../dto/user-role-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { Permissions } from '../constants/permissions.constants';
import { RoleResponseDto } from '../dto/role-response.dto';

@Controller('admin/rbac/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permissions.MANAGE_RBAC)
export class UserRolesController {
  constructor(private readonly rbacService: RBACService) {}

  @Get(':userId/roles')
  async getUserRoles(@Param('userId') userId: string): Promise<UserRoleResponseDto> {
    const roles = await this.rbacService.getUserRoles(userId);

    const roleResponseDtos: RoleResponseDto[] = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    return {
      userId,
      roles: roleResponseDtos,
    };
  }

  @Post(':userId/roles')
  @HttpCode(HttpStatus.OK)
  async assignRoles(
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesToUserDto,
  ): Promise<UserRoleResponseDto> {
    await this.rbacService.assignRolesToUser(userId, assignRolesDto.roleIds);
    return this.getUserRoles(userId);
  }

  @Delete(':userId/roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRole(@Param('userId') userId: string, @Param('roleId') roleId: string): Promise<void> {
    await this.rbacService.removeRoleFromUser(userId, roleId);
  }
}

