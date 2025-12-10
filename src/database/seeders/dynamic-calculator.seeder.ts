import { DataSource } from 'typeorm';
import { DynamicCalculator } from '../../modules/dynamic-calculator/entities/dynamic-calculator.entity';
import { Setting } from '../../modules/settings/entities/setting.entity';

export class DynamicCalculatorSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const calculatorRepository = dataSource.getRepository(DynamicCalculator);
    const settingRepository = dataSource.getRepository(Setting);

    console.log('🌱 Seeding dynamic calculator configurations...\n');

    await calculatorRepository
      .createQueryBuilder()
      .delete()
      .from(DynamicCalculator)
      .execute();

    const warehouseTypes = ['Silo', 'Cold storage', 'flatbed'];
    const warehouseCategories = ['New', 'enhanced'];
    const provinces = ['Punjab', 'sindh', 'balochistan', 'gilgit', 'kpk'];

    const configurations = [];

    // Create sample combinations
    for (const warehouseType of warehouseTypes) {
      for (const warehouseCategory of warehouseCategories) {
        for (const province of provinces) {
          // Set accreditation fee based on category
          const accreditationFee = warehouseCategory === 'New' ? 120.00 : 80.00;
          
          // Set sales tax value based on province (matching settings seeder values)
          let salesTaxValue = 15.00;
          if (province === 'Punjab') {
            salesTaxValue = 16.00;
          }

          // Fetch sales tax setting based on province
          const provinceKey = province.toLowerCase().replace(/\s+/g, '-');
          const settingKey = `${provinceKey}-sales-tax`;
          const salesTaxSetting = await settingRepository.findOne({
            where: { key: settingKey },
          });

          configurations.push({
            warehouseType,
            warehouseCategory,
            province,
            accreditationFee,
            salesTaxSettingId: salesTaxSetting?.id || null,
            salesTaxValue,
          });
        }
      }
    }

    for (const config of configurations) {
      const calculatorEntity = calculatorRepository.create(config);
      await calculatorRepository.save(calculatorEntity);
      console.log(`✓ Created: ${config.warehouseType} - ${config.warehouseCategory} - ${config.province}`);
    }

    console.log('\n✅ Dynamic calculator seeding completed\n');
  }
}

