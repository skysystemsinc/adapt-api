import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDynamicCalculatorDto {
  @ApiProperty({ description: 'Warehouse type', example: 'Silo' })
  @IsString()
  @IsNotEmpty()
  warehouseType: string;

  @ApiProperty({ description: 'Warehouse category', example: 'New' })
  @IsString()
  @IsNotEmpty()
  warehouseCategory: string;

  @ApiProperty({ description: 'Province', example: 'Punjab' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ description: 'Accreditation fee in PKR', example: 120.00 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsNotEmpty()
  accreditationFee: number;

  @ApiProperty({ description: 'Sales tax value', example: 16.00, required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  salesTaxValue?: number | null;
}

