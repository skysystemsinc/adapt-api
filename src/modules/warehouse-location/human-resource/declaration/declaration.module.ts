import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DeclarationService } from './declaration.service';
import { DeclarationController } from './declaration.controller';
import { Declaration } from './entities/declaration.entity';
import { HumanResource } from '../entities/human-resource.entity';

@Module({
  controllers: [DeclarationController],
  providers: [DeclarationService],
  imports: [
    TypeOrmModule.forFeature([Declaration, HumanResource]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [DeclarationService],
})
export class DeclarationModule {}

