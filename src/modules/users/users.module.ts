import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersAdminController } from './users-admin.controller';
import { UserRequestsController } from './controllers/user-requests.controller';
import { UserRequestsService } from './services/user-requests.service';
import { User } from './entities/user.entity';
import { UserRequest } from './entities/user-request.entity';
import { Role } from '../rbac/entities/role.entity';
import { Organization } from '../organization/entities/organization.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RBACModule } from '../rbac/rbac.module';
import { RegistrationApplicationDetails } from '../registration-application/entities/registration-application-details.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRequest, Role, Organization, RegistrationApplicationDetails]),
    RBACModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController, UsersAdminController, UserRequestsController],
  providers: [UsersService, UserRequestsService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {
  static forRoot(): DynamicModule {
    return {
      module: UsersModule,
      imports: [TypeOrmModule.forFeature([User, RegistrationApplicationDetails])],
    };
  }
}
