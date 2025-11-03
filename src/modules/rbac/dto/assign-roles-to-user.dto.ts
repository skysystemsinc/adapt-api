import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class AssignRolesToUserDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  roleIds: string[];
}

