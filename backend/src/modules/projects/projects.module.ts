import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project, ProjectSchema } from '../../schemas/project.schema';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    PgDocumentModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    AuditLogModule,
    SalesModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
