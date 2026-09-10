import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { RoleEntity, UserEntity } from '../../database/entities/release1.entity';
import { Role } from '../../common/enums';
import { UpdateUserDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private roles: Repository<RoleEntity>,
  ) {}

  async findAll(query: { role?: string; departmentId?: string; isActive?: boolean }) {
    const where: FindOptionsWhere<UserEntity> = { deletedAt: IsNull() };

    if (query.role && /^[a-z][a-z0-9_]{1,59}$/.test(query.role)) where.role = query.role;

    // Validate departmentId is a proper UUID before querying
    if (query.departmentId && isUUID(query.departmentId)) {
      where.departmentId = query.departmentId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    // Explicitly exclude password from all list responses
    return this.users.find({ where, relations: { department: true }, order: { firstName: 'ASC', lastName: 'ASC' } });
  }

  async findById(id: string) {
    if (!isUUID(id)) throw new NotFoundException('User not found');
    const user = await this.users.findOne({ where: { _id: id, deletedAt: IsNull() }, relations: { department: true } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    if (!isUUID(id)) throw new NotFoundException('User not found');
    const user = await this.users.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.role) {
      const role = await this.roles.findOne({ where: { key: dto.role, isActive: true, deletedAt: IsNull() } });
      if (!role) throw new BadRequestException('Select an active role');
      user.role = role.key;
      user.roleId = role._id;
    }
    const { role: _role, ...changes } = dto;
    return this.users.save(this.users.merge(user, changes));
  }

  async delete(id: string) {
    if (!isUUID(id)) throw new NotFoundException('User not found');
    const user = await this.users.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Admin users cannot be deleted');
    }

    user.isActive = false;
    await this.users.save(user);
    await this.users.softDelete(id);
    return { message: 'User deleted' };
  }
}
