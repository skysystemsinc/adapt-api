import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

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
    type: 'string',
    format: 'binary',
    description: 'Training certificate file (PDF, PNG, JPG, JPEG, DOC, DOCX). Max size: 10MB',
    required: false,
  })
  @Transform(({ value }) => {
    if (value === '' || value === null) return undefined;
    return value;
  })
  @IsOptional()
  @Exclude()
  trainingCertificate?: any;
}
