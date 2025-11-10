import { PartialType } from '@nestjs/swagger';
import { CreateWarehouseOperatorApplicationRequestDto } from './create-warehouse.dto';

export class UpdateWarehouseDto extends PartialType(CreateWarehouseOperatorApplicationRequestDto) {}
