import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  async create(createDto: CreateSettingDto): Promise<Setting> {
    // Check if setting with this key already exists
    const existing = await this.settingsRepository.findOne({
      where: { key: createDto.key },
    });

    if (existing) {
      throw new ConflictException(`Setting with key "${createDto.key}" already exists`);
    }

    const setting = this.settingsRepository.create(createDto);
    return this.settingsRepository.save(setting);
  }

  async findAll(): Promise<Setting[]> {
    return this.settingsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with ID "${id}" not found`);
    }

    return setting;
  }

  async findByKey(key: string): Promise<Setting> {
    const setting = await this.settingsRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    return setting;
  }

  async update(id: string, updateDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findOne(id);

    // If updating key, check if new key already exists
    if (updateDto.key && updateDto.key !== setting.key) {
      const existing = await this.settingsRepository.findOne({
        where: { key: updateDto.key },
      });

      if (existing) {
        throw new ConflictException(`Setting with key "${updateDto.key}" already exists`);
      }
    }

    Object.assign(setting, updateDto);
    return this.settingsRepository.save(setting);
  }

  async updateByKey(key: string, value: string): Promise<Setting> {
    const setting = await this.findByKey(key);
    setting.value = value;
    return this.settingsRepository.save(setting);
  }

  async remove(id: string): Promise<void> {
    const setting = await this.findOne(id);
    await this.settingsRepository.remove(setting);
  }

  async removeByKey(key: string): Promise<void> {
    const setting = await this.findByKey(key);
    await this.settingsRepository.remove(setting);
  }
}

