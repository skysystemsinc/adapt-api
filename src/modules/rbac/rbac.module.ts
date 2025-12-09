import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';
import { RoleRequest } from './entities/role-request.entity';
import { RolePermissionRequest } from './entities/role-permission-request.entity';
import { RolesService } from './services/roles.service';
import { PermissionsService } from './services/permissions.service';
import { RBACService } from './services/rbac.service';
import { RoleRequestsService } from './services/role-requests.service';
import { RolesController } from './controllers/roles.controller';
import { PermissionsController } from './controllers/permissions.controller';
import { UserRolesController } from './controllers/user-roles.controller';
import { RoleRequestsController } from './controllers/role-requests.controller';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, RolePermission, UserRole, RoleRequest, RolePermissionRequest]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RolesController, PermissionsController, UserRolesController, RoleRequestsController],
  providers: [RolesService, PermissionsService, RBACService, RoleRequestsService, PermissionsGuard],
  exports: [RBACService, PermissionsGuard],
})
export class RBACModule {}

