import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { Component, ComponentSchema } from '../../schemas/component.schema';
import { Project, ProjectSchema } from '../../schemas/project.schema';
import { Deliverable, DeliverableSchema } from '../../schemas/deliverable.schema';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ComponentsController } from './components.controller';
import { ComponentsService } from './components.service';
import { ComponentReminderWorker } from './component-reminder.worker';
import { Item, ItemSchema } from '../../schemas/item.schema';
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

@Module({
  imports: [
    PgDocumentModule.forFeature([
      { name: Component.name, schema: ComponentSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Deliverable.name, schema: DeliverableSchema },
      { name: Machine.name, schema: MachineSchema },
      { name: Unit.name, schema: UnitSchema },
      { name: EquipmentModule.name, schema: EquipmentModuleSchema },
      { name: ControlModule.name, schema: ControlModuleSchema },
      { name: Item.name, schema: ItemSchema },
    ]),
    AuditLogModule,
    NotificationsModule,
  ],
  controllers: [ComponentsController],
  providers: [ComponentsService, ComponentReminderWorker],
  exports: [ComponentsService],
})
export class ComponentsModule {}
