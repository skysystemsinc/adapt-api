import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewEntity } from './entities/review.entity';
import { AssessmentDetailsEntity } from './entities/assessment_details.entity';
import { UsersModule } from '../../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WarehouseOperator } from '../entities/warehouse-operator.entity';
import { WarehouseOperatorApplicationRequest } from '../entities/warehouse-operator-application-request.entity';
import { WarehouseLocation } from '../../warehouse-location/entities/warehouse-location.entity';
import { WarehouseOperatorLocation } from '../../warehouse-operator-location/entities/warehouse-operator-location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEntity, AssessmentDetailsEntity, WarehouseOperator, WarehouseOperatorApplicationRequest, WarehouseLocation, WarehouseOperatorLocation]),
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
