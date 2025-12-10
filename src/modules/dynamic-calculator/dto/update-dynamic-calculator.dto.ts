import { PartialType } from '@nestjs/swagger';
import { CreateDynamicCalculatorDto } from './create-dynamic-calculator.dto';

export class UpdateDynamicCalculatorDto extends PartialType(CreateDynamicCalculatorDto) {}

