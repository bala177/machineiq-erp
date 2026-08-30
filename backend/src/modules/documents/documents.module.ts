import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { ProjectDocument, ProjectDocumentSchema, DecisionLog, DecisionLogSchema, Comment, CommentSchema } from '../../schemas/document.schema';

@Module({
  imports: [
    PgDocumentModule.forFeature([
      { name: ProjectDocument.name, schema: ProjectDocumentSchema },
      { name: DecisionLog.name, schema: DecisionLogSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
