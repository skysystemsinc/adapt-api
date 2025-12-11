import { DataSource } from 'typeorm';
import { Setting } from '../../modules/settings/entities/setting.entity';
import { DynamicCalculator } from '../../modules/dynamic-calculator/entities/dynamic-calculator.entity';

export class SettingsSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const settingsRepository = dataSource.getRepository(Setting);
    const calculatorRepository = dataSource.getRepository(DynamicCalculator);

    console.log('🌱 Seeding settings...\n');

    // First, set salesTaxSettingId to NULL in dynamic_calculator to break foreign key references
    await calculatorRepository
      .createQueryBuilder()
      .update(DynamicCalculator)
      .set({ salesTaxSettingId: null })
      .execute();

    // Now we can safely delete all settings
    await settingsRepository
      .createQueryBuilder()
      .delete()
      .from(Setting)
      .execute();
      
    const settings = [
      { key: 'self-assessment', value: 'https://naymatcollateral.com/' },
      { key: 're-self-assessment', value: 'https://naymatcollateral.com/' },
      { key: 'new-calculator', value: '40' },
      { key: 'existing-calculator', value: '20' },
      { key: 'tariff-schedule', value: 'https://naymatcollateral.com/' },
      { key: 'warehouse-guidelines', value: 'https://naymatcollateral.com/' },
      { key: 'standard-operating-procedure', value: 'https://naymatcollateral.com/' },
      { key: 'cmc-regulations-2019', value: 'https://naymatcollateral.com/' },
      { key: 'accreditation-process-awareness-video', value: 'https://naymatcollateral.com/' },
      { key: 'sindh-sales-tax', value: '15' },
      { key: 'punjab-sales-tax', value: '16' },
      { key: 'balochistan-sales-tax', value: '15' },
      { key: 'kpk-sales-tax', value: '15' },
      { key: 'gilgit-sales-tax', value: '15' },
    ];

    for (const setting of settings) {
      const exists = await settingsRepository.findOne({
        where: { key: setting.key },
      });

      if (!exists) {
        const settingEntity = settingsRepository.create(setting);
        await settingsRepository.save(settingEntity);
        console.log(`✓ Created setting: ${setting.key}`);
      } else {
        console.log(`- Setting already exists: ${setting.key}`);
      }
    }

    console.log('\n✅ Settings seeding completed\n');
  }
}

