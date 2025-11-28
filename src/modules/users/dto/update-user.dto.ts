import { IsEmail, IsString, IsUUID, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
    @IsEmail()
    @IsOptional()
    @Transform(({ value }: { value: string }) => value?.toLowerCase())
    email?: string;

    @IsString()
    @IsOptional()
    @Transform(({ value }: { value: string }) => value?.toLowerCase())
    firstName?: string;

    @IsString()
    @IsOptional()
    @Transform(({ value }: { value: string }) => value?.toLowerCase())
    lastName?: string;

    @IsUUID()
    @IsOptional()
    roleId?: string;

    @IsUUID()
    @IsOptional()
    organizationId?: string | null;
}