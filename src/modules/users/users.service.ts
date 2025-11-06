import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { RBACService } from '../rbac/services/rbac.service';
import { QueryUsersDto, UserTypeFilter } from './dto/query-users.dto';
import { ApplicantUserResponseDto, InternalUserResponseDto } from './dto/user-response.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private rbacService: RBACService,
  ) {}

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

  async findAllInternal(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['userRoles', 'userRoles.role'],
      where: {
        userRoles: {
          role: {
            name: Not("Applicant"),
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
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
      data = users.map((user) => ({
        id: user.id,
        email: user.email,
        name: 'test',
      }));
    } else {
      data = users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
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
}
