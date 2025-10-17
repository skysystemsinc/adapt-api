import { ApiProperty } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
import dayjs from "dayjs";

// Response DTO
export class ApplicationTypeResponseDto {
    @ApiProperty()
    @Expose()
    id: string;
  
    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty()
    @Expose()
    slug: string;
  
    @ApiProperty()
    isActive: boolean;
  
    @ApiProperty()
    @Transform(({ value }: { value: Date }) => dayjs(value).format('DD-MMM-YYYY'))
    createdAt: Date;
  
    @ApiProperty()
    @Transform(({ value }: { value: Date }) => dayjs(value).format('DD-MMM-YYYY'))
    updatedAt: Date;
  }