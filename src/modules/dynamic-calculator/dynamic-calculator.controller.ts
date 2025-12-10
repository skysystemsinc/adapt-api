import {
  Controller,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DynamicCalculatorService } from './dynamic-calculator.service';
import { DynamicCalculator } from './entities/dynamic-calculator.entity';

@ApiTags('Dynamic Calculator')
@Controller('dynamic-calculator')
export class DynamicCalculatorController {
  constructor(private readonly dynamicCalculatorService: DynamicCalculatorService) {}

  @Get()
  @ApiOperation({ summary: 'Get all dynamic calculator configurations (public)' })
  @ApiResponse({ status: 200, description: 'List of dynamic calculators', type: [DynamicCalculator] })
  async findAll(): Promise<DynamicCalculator[]> {
    return this.dynamicCalculatorService.findAll();
  }
}

