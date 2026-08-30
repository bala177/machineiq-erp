import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { UserEntity } from '../../database/entities/release1.entity';
import { Role } from '../../common/enums';
import { UpdateUserDto } from './users.dto';

const VALID_ROLES = new Set<string>(Object.values(Role));
@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private users: Repository<UserEntity>) {}

  async findAll(query: { role?: string; departmentId?: string; isActive?: boolean }) {
    const where: FindOptionsWhere<UserEntity> = { deletedAt: IsNull() };

    // Whitelist role against known enum values to prevent NoSQL operator injection
    if (query.role && VALID_ROLES.has(query.role)) {
      where.role = query.role as Role;
    }

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
    return this.users.save(this.users.merge(user, dto));
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
