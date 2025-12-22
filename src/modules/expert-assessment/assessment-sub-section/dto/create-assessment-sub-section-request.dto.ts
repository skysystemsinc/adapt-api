import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, IsUUID, Min } from 'class-validator';
import { AssessmentSubSectionRequestAction } from '../entities/assessment-sub-section-request.entity';

export class CreateAssessmentSubSectionRequestDto {
  @ApiProperty({ description: 'Sub-section ID this request is for (null for new sub-section creation)', required: false })
  @IsUUID('4')
  @IsOptional()
  subSectionId?: string;

  @ApiProperty({ description: 'ID of the parent expert assessment', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4')
  @IsNotEmpty()
  assessmentId: string;

  @ApiProperty({ description: 'Sub-section name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Display order', default: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'Whether the sub-section is active', default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Action: create, update, or delete', default: 'update', required: false })
  @IsString()
  @IsOptional()
  action?: AssessmentSubSectionRequestAction;
}
