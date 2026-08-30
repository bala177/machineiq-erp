import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { MachinesModule } from './modules/machines/machines.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { DeliverablesModule } from './modules/deliverables/deliverables.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ComponentsModule } from './modules/components/components.module';
import { DiscussionModule } from './modules/discussion/discussion.module';
import { MachineTemplatesModule } from './modules/machine-templates/machine-templates.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ItemsModule } from './modules/items/items.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { SequencesModule } from './modules/sequences/sequences.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { DocumentTypesModule } from './modules/document-types/document-types.module';
import { HealthController } from './health.controller';
import { postgresOptions } from './database/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => postgresOptions(),
    }),
    // Global rate limiting: 120 requests per minute per IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    SequencesModule,
    PermissionsModule,
    DocumentTypesModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    CustomersModule,
    OpportunitiesModule,
    ProjectsModule,
    MachinesModule,
    TasksModule,
    DeliverablesModule,
    ProcurementModule,
    DocumentsModule,
    NotificationsModule,
    DashboardModule,
    AuditLogModule,
    SettingsModule,
    ComponentsModule,
    DiscussionModule,
    MachineTemplatesModule,
    QuotesModule,
    InvoicesModule,
    ItemsModule,
    OrganizationModule,
    SuppliersModule,
  ],
  controllers: [HealthController],
  providers: [
    // Apply ThrottlerGuard globally to all endpoints
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
