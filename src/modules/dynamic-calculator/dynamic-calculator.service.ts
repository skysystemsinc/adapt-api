import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DynamicCalculator } from './entities/dynamic-calculator.entity';
import { Setting } from '../settings/entities/setting.entity';
import { CreateDynamicCalculatorDto } from './dto/create-dynamic-calculator.dto';
import { UpdateDynamicCalculatorDto } from './dto/update-dynamic-calculator.dto';

@Injectable()
export class DynamicCalculatorService {
  constructor(
    @InjectRepository(DynamicCalculator)
    private dynamicCalculatorRepository: Repository<DynamicCalculator>,
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
  ) {}

  private async getSalesTaxSetting(province: string): Promise<Setting | null> {
    const provinceKey = province.toLowerCase().replace(/\s+/g, '-');
    const settingKey = `${provinceKey}-sales-tax`;
    
    const setting = await this.settingRepository.findOne({
      where: { key: settingKey },
    });
    
    return setting || null;
  }

  async create(createDto: CreateDynamicCalculatorDto): Promise<DynamicCalculator> {
    const salesTaxSetting = await this.getSalesTaxSetting(createDto.province);
    
    const calculator = this.dynamicCalculatorRepository.create({
      ...createDto,
      salesTaxSettingId: salesTaxSetting?.id || null,
      salesTaxValue: salesTaxSetting ? parseFloat(salesTaxSetting.value) : null,
    });
    
    return this.dynamicCalculatorRepository.save(calculator);
  }

  async findAll(): Promise<DynamicCalculator[]> {
    return this.dynamicCalculatorRepository.find({
      relations: ['salesTax'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DynamicCalculator> {
    const calculator = await this.dynamicCalculatorRepository.findOne({
      where: { id },
      relations: ['salesTax'],
    });

    if (!calculator) {
      throw new NotFoundException(`Dynamic calculator with ID "${id}" not found`);
    }

    return calculator;
  }

  async update(id: string, updateDto: UpdateDynamicCalculatorDto): Promise<DynamicCalculator> {
    const calculator = await this.findOne(id);
    
    // If province is being updated, fetch the new sales tax setting
    const provinceToUse = updateDto.province || calculator.province;
    if (updateDto.province && updateDto.province !== calculator.province) {
      const salesTaxSetting = await this.getSalesTaxSetting(updateDto.province);
      calculator.salesTaxSettingId = salesTaxSetting?.id || null;
      calculator.salesTaxValue = salesTaxSetting ? parseFloat(salesTaxSetting.value) : null;
    } else if (!updateDto.province) {
      // If province is not being updated, ensure sales tax value is set from current setting
      const salesTaxSetting = await this.getSalesTaxSetting(provinceToUse);
      if (salesTaxSetting && !calculator.salesTaxValue) {
        calculator.salesTaxValue = parseFloat(salesTaxSetting.value);
      }
    }
    
    Object.assign(calculator, updateDto);
    return this.dynamicCalculatorRepository.save(calculator);
  }

  async remove(id: string): Promise<void> {
    const calculator = await this.findOne(id);
    await this.dynamicCalculatorRepository.remove(calculator);
  }
}

