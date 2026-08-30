import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DepartmentEntity } from '../../database/entities/release1.entity';

@Injectable()
export class DepartmentsService {
  constructor(@InjectRepository(DepartmentEntity) private departments: Repository<DepartmentEntity>) {}

  async create(dto: { name: string; code?: string; description?: string }) {
    return this.departments.save(this.departments.create(dto));
  }

  async findAll() {
    return this.departments.find({ where: { deletedAt: IsNull() }, order: { name: 'ASC' } });
  }

  async findById(id: string) {
    const dept = await this.departments.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(id: string, dto: Partial<DepartmentEntity>) {
    const dept = await this.departments.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!dept) throw new NotFoundException('Department not found');
    return this.departments.save(this.departments.merge(dept, dto));
  }

  async softDelete(id: string) {
    const dept = await this.departments.findOne({ where: { _id: id, deletedAt: IsNull() } });
    if (!dept) throw new NotFoundException('Department not found');
    dept.isActive = false;
    await this.departments.save(dept);
    await this.departments.softDelete(id);
    return { message: 'Department deleted' };
  }
}
