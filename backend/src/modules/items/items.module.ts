import { Module } from '@nestjs/common';
import { PgDocumentModule } from '../../database/postgres-document.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Item, ItemCategory, ItemCategorySchema, ItemSchema, Uom, UomSchema } from '../../schemas/item.schema';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    PgDocumentModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: ItemCategory.name, schema: ItemCategorySchema },
      { name: Uom.name, schema: UomSchema },
    ]),
    AuditLogModule,
    SettingsModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
