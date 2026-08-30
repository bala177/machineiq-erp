import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Project, ProjectSchema } from '../../schemas/project.schema';
import { Task, TaskSchema } from '../../schemas/task.schema';
import { Deliverable, DeliverableSchema } from '../../schemas/deliverable.schema';
import { ProcurementItem, ProcurementItemSchema } from '../../schemas/procurement.schema';
import { Component, ComponentSchema } from '../../schemas/component.schema';
import { Unit, UnitSchema, Machine, MachineSchema } from '../../schemas/machine.schema';
import { Opportunity, OpportunitySchema } from '../../schemas/opportunity.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';

@Module({
  imports: [
    PgDocumentModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Deliverable.name, schema: DeliverableSchema },
      { name: ProcurementItem.name, schema: ProcurementItemSchema },
      { name: Component.name, schema: ComponentSchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Machine.name, schema: MachineSchema },
      { name: Opportunity.name, schema: OpportunitySchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
