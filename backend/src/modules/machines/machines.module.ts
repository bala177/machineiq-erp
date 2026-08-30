import { Module as NestModule } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { MachinesService } from './machines.service';
import { MachinesController } from './machines.controller';
import {
  ControlModule,
  ControlModuleSchema,
  EquipmentModule,
  EquipmentModuleSchema,
  Machine,
  MachineSchema,
  Unit,
  UnitSchema,
} from '../../schemas/machine.schema';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Component, ComponentSchema } from '../../schemas/component.schema';
import { MachineMetaController } from './meta.controller';
import { Task, TaskSchema } from '../../schemas/task.schema';

@NestModule({
  imports: [
    PgDocumentModule.forFeature([
      { name: Machine.name, schema: MachineSchema },
      { name: Unit.name, schema: UnitSchema },
      { name: 'Module', schema: UnitSchema },
      { name: EquipmentModule.name, schema: EquipmentModuleSchema },
      { name: 'Subassembly', schema: EquipmentModuleSchema },
      { name: ControlModule.name, schema: ControlModuleSchema },
      { name: Component.name, schema: ComponentSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    AuditLogModule,
  ],
  controllers: [MachinesController, MachineMetaController],
  providers: [MachinesService],
  exports: [MachinesService],
})
export class MachinesModule {}
