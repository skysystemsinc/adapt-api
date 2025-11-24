import { PartialType } from '@nestjs/swagger';
import { CreateHumanResourceDto } from './create-human-resource.dto';

export class UpdateHumanResourceDto extends PartialType(CreateHumanResourceDto) {}
