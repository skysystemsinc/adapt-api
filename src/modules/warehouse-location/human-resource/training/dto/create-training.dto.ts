import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseFileUploadDto } from 'src/common/dto/base-file-upload.dto';

export class CreateTrainingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  trainingTitle: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  conductedBy: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  trainingType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  duration: string;

  @IsDateString()
  @IsOptional()
  dateOfCompletion?: Date | null;

  @ApiProperty({
    type: BaseFileUploadDto,
    description: 'Training certificate file (base64 encoded). Max size: 10MB',
    required: false,
  })
  @IsOptional()
  trainingCertificate?: BaseFileUploadDto;
}
