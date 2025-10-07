import { PartialType } from '@nestjs/swagger';
import { CreateAuthorityLevelDto } from './create-authority-level.dto';

export class UpdateAuthorityLevelDto extends PartialType(CreateAuthorityLevelDto) {}