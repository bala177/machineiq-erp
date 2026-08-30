import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { MachineTemplate } from '../../schemas/machine-template.schema';
import { CreateMachineTemplateDto } from './machine-templates.dto';

@Injectable()
export class MachineTemplatesService {
  constructor(
    @InjectPgModel(MachineTemplate.name) private templateModel: Model<MachineTemplate>,
  ) {}

  findAll() {
    return this.templateModel
      .find({ deletedAt: null })
      .sort({ usageCount: -1, name: 1 })
      .exec();
  }

  async findById(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Template not found');
    const template = await this.templateModel.findOne({ _id: id, deletedAt: null });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  create(dto: CreateMachineTemplateDto) {
    return this.templateModel.create(dto);
  }

  async incrementUsage(id: string) {
    if (!DatabaseId.isValid(id)) return;
    await this.templateModel.updateOne({ _id: id }, { $inc: { usageCount: 1 } });
  }
}
