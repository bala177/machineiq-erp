import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { MachineTemplate, MachineTemplateSchema } from '../../schemas/machine-template.schema';
import { MachineTemplatesController } from './machine-templates.controller';
import { MachineTemplatesService } from './machine-templates.service';

@Module({
  imports: [
    PgDocumentModule.forFeature([
      { name: MachineTemplate.name, schema: MachineTemplateSchema },
    ]),
  ],
  controllers: [MachineTemplatesController],
  providers: [MachineTemplatesService],
  exports: [MachineTemplatesService],
})
export class MachineTemplatesModule {}
