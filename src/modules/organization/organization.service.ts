import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization, OrganizationType, OrganizationStatus } from './entities/organization.entity';
import { DataSource, ILike, In, Like, Repository } from 'typeorm';
import { generateSlug } from 'src/common/utils/helper.utils';
import { ListOrganizationDto, ListOrganizationResponseDto } from './dto/list-organization.dto';

@Injectable()
export class OrganizationService {
  private readonly organizationRepository: Repository<Organization>;

  constructor(private readonly dataSource: DataSource) {
    this.organizationRepository = dataSource.getRepository(Organization);
  }

  async create(createOrganizationDto: CreateOrganizationDto, userId: string): Promise<Organization> {
    try {
      const slug = await this.generateSlug(createOrganizationDto.name);
      const code = await this.generateCode();

      // HANDLE UNIQUE NAME
      const existingOrganization = await this.organizationRepository.findOne({
        where: { name: createOrganizationDto.name },
      });

      if (existingOrganization) {
        throw new BadRequestException('Organization with this name already exists');
      }
  
      const organization = this.organizationRepository.create({
        code,
        name: createOrganizationDto.name,
        slug,
        status: OrganizationStatus.ACTIVE,
        type: createOrganizationDto.type,
        createdByUser: { id: userId } as Organization['createdByUser'],
      });
  
      return this.organizationRepository.save(organization);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create organization');
    }
  }

  async findAll(query?: ListOrganizationDto): Promise<ListOrganizationResponseDto> {
    const page = query?.page ? Number(query.page) : 1;
    const limit = query?.limit ? Number(query.limit) : 10;
    const search = query?.search || '';
    const sortBy = query?.sortBy || 'createdAt';
    const sortOrder = query?.sortOrder || 'DESC';
    const status = query?.status;

    // Ensure page and limit are valid numbers
    const validPage = isNaN(page) || page < 1 ? 1 : page;
    const validLimit = isNaN(limit) || limit < 1 ? 10 : limit;
    const skip = (validPage - 1) * validLimit;

    const whereCondition: any = {};

    if (search) {
      whereCondition.name = ILike(`%${search}%`);
    }

    if (status) {
      whereCondition.status = status;
    }

    const [organizations, total] = await this.organizationRepository.findAndCount({
      skip,
      take: validLimit,
      where: whereCondition,
      order: { [sortBy]: sortOrder as 'ASC' | 'DESC' },
      relations: ['createdByUser'],
      select: {
        id: true,
        code: true,
        name: true,
        slug: true,
        status: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        createdByUser: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    const orgDtos = organizations.map(org => ({
      id: org.id,
      code: org.code,
      name: org.name,
      slug: org.slug,
      status: org.status,
      type: org.type,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      createdBy: org.createdByUser?.firstName + ' ' + org.createdByUser?.lastName,
    }));

    return {
      organizations: orgDtos,
      total,
      page: validPage,
      limit: validLimit,
    };
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto, userId: string): Promise<Organization> {
    const organization = await this.findOne(id);

    if (updateOrganizationDto.name) {
      organization.name = updateOrganizationDto.name;
      organization.slug = await this.generateSlug(updateOrganizationDto.name);
    }

    if (updateOrganizationDto.type) {
      organization.type = updateOrganizationDto.type;
    }

    if (updateOrganizationDto.status) {
      organization.status = updateOrganizationDto.status;
    }

    return this.organizationRepository.save(organization);
  }

  async remove(id: string): Promise<void> {
    const organization = await this.findOne(id);
    await this.organizationRepository.remove(organization);
  }

  private async generateSlug(name: string): Promise<string> {
    const slug = generateSlug(name);

    const existingCount = await this.organizationRepository.count({
      where: { slug: ILike(`${slug}%`) },
    });

    return existingCount > 0 ? `${slug}-${existingCount + 1}` : slug;
  }

  private async generateCode(): Promise<string> {
    const count = await this.organizationRepository.count();
    const code = `ORG-${String(count + 1).padStart(3, '0')}`;
    return code;
  }

}
