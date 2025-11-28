import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { RBACService } from '../rbac/services/rbac.service';
import { QueryUsersDto, UserTypeFilter } from './dto/query-users.dto';
import { ApplicantUserResponseDto, InternalUserResponseDto } from './dto/user-response.dto';
import { RegistrationApplicationDetails } from '../registration-application/entities/registration-application-details.entity';
import { Organization } from '../organization/entities/organization.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../rbac/entities/user-role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RegistrationApplicationDetails)
    private registrationApplicationDetailsRepository: Repository<RegistrationApplicationDetails>,
    private rbacService: RBACService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Extract roleId from DTO (it's not a user entity field)
    const { roleId, ...userData } = createUserDto;

    // Create new user (without roleId)
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
      organization: createUserDto.organizationId ? { id: createUserDto.organizationId } : undefined,
    });

    const savedUser = await this.userRepository.save(user);

    // Assign role to the user
    if (roleId) {
      await this.rbacService.assignRolesToUser(savedUser.id, [roleId]);
    }

    // Return user with roles loaded (reload to get fresh role associations)
    const userWithRoles = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['userRoles', 'userRoles.role'],
    });

    return userWithRoles || savedUser;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        userRoles: {
          role: {
            name: ("Applicant"),
          },
        },
      },
    });
  }

  async findAllInternal(): Promise<any> {
    const users = await this.userRepository.find({
      relations: ['userRoles', 'userRoles.role', 'organization'],
      where: {
        userRoles: {
          role: {
            name: Not("Applicant"),
          },
        },
      },
      order: {
        createdAt: 'DESC',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        organization: {
          name: true,
        },
        userRoles: {
          id: true,
          role: {
            name: true,
          },
        },
      }
    });
    return users;
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userRoles', 'userRoles.role', 'organization'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        organization: {
          id: true,
          name: true,
        },
        userRoles: {
          id: true,
          role: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async findOneWithRoles(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['userRoles', 'userRoles.role', 'userRoles.role.rolePermissions', 'userRoles.role.rolePermissions.permission'],
    });
  }

  async findByEmailWithRoles(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role', 'userRoles.role.rolePermissions', 'userRoles.role.rolePermissions.permission'],
    });
  }

  async findAllPaginated(query: QueryUsersDto): Promise<{
    data: ApplicantUserResponseDto[] | InternalUserResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { type, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .leftJoinAndSelect('user.organization', 'organization')
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC');

    if (type === UserTypeFilter.APPLICANT) {
      queryBuilder.andWhere('role.name = :roleName', { roleName: 'Applicant' });
    } else if (type === UserTypeFilter.INTERNAL_USERS) {
      queryBuilder.andWhere('role.name != :roleName', { roleName: 'Applicant' });
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    let data: ApplicantUserResponseDto[] | InternalUserResponseDto[];

    if (type === UserTypeFilter.APPLICANT) {
      // Fetch business/company names for applicants (same as frontend)
      const businessNameLabels = [
        'Business / Applicant Name (as per CNIC)',
        'Business Name of Partnership (as per registration)',
        'Company Name (as per SECP Registration)',
        'Company Name (as per SECP Registration)',
        'testign123',
        'Business / Company Name',
      ];

      const usersWithNames = await Promise.all(
        users.map(async (user) => {
          // Step 1: Find the applicationId by email
          const emailDetail = await this.registrationApplicationDetailsRepository
            .createQueryBuilder('detail')
            .select(['detail.id', 'application.id'])
            .innerJoin('detail.application', 'application')
            .where('detail.value = :email', { email: user.email })
            .andWhere('application.status = :status', { status: 'APPROVED' })
            .getOne();

          let businessName = 'N/A';

          if (emailDetail?.application?.id) {
            // Step 2: Get ALL application details for this applicationId
            const allDetails = await this.registrationApplicationDetailsRepository
              .createQueryBuilder('detail')
              .where('detail.application.id = :applicationId', {
                applicationId: emailDetail.application.id
              })
              .getMany();

            // Step 3: Filter details in memory by label and get the name
            const nameDetail = allDetails.find(detail =>
              detail.label && businessNameLabels.includes(detail.label)
            );

            if (nameDetail?.value) {
              businessName = nameDetail.value;
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: businessName,
          };
        }),
      );

      data = usersWithNames;
    } else {
      data = users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        type: user?.organization?.type || 'N/A',
        organization: user.organization?.name || 'N/A',
        role: user.userRoles?.[0]?.role?.name || 'N/A',
      }));
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being updated and if it conflicts with another user
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Update user fields
    if (updateUserDto.firstName !== undefined) {
      user.firstName = updateUserDto.firstName;
    }
    if (updateUserDto.lastName !== undefined) {
      user.lastName = updateUserDto.lastName;
    }
    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email;
    }
    if (updateUserDto.organizationId !== undefined) {
      if (updateUserDto.organizationId) {
        user.organization = { id: updateUserDto.organizationId } as Organization;
      }
    }

    const savedUser = await this.userRepository.save(user);

    // Update role if provided
    if (updateUserDto.roleId !== undefined) {
      if (updateUserDto.roleId) {
        await this.rbacService.assignRolesToUser(savedUser.id, [updateUserDto.roleId]);
      } else {
        await this.userRepository.manager.getRepository(UserRole).delete({ userId: savedUser.id });
      }
    }

    // Return updated user with relations
    const updatedUser = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['userRoles', 'userRoles.role', 'organization'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        organization: {
          id: true,
          name: true,
        },
        userRoles: {
          id: true,
          role: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedUser || savedUser;
  }
}
