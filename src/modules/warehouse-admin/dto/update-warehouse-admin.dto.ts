import { PartialType } from '@nestjs/swagger';
import { CreateWarehouseAdminDto } from './create-warehouse-admin.dto';

export class UpdateWarehouseAdminDto extends PartialType(CreateWarehouseAdminDto) {}
