import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { DiscussionController } from './discussion.controller';
import { DiscussionService } from './discussion.service';
import { DiscussionEntry, DiscussionEntrySchema } from '../../schemas/discussion.schema';

@Module({
  imports: [
    PgDocumentModule.forFeature([{ name: DiscussionEntry.name, schema: DiscussionEntrySchema }]),
  ],
  controllers: [DiscussionController],
  providers: [DiscussionService],
})
export class DiscussionModule {}
