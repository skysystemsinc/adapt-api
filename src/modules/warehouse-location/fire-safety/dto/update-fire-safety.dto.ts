import { PartialType } from '@nestjs/swagger';
import { CreateFireSafetyDto } from './create-fire-safety.dto';

export class UpdateFireSafetyDto extends PartialType(CreateFireSafetyDto) {}
