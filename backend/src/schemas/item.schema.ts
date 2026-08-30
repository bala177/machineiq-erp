import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';

export enum ItemType {
  RAW = 'raw',
  COMPONENT = 'component',
  ASSEMBLY = 'assembly',
  SERVICE = 'service',
}

@Schema({ timestamps: true })
export class ItemCategory extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: DatabaseId, ref: 'ItemCategory', default: null })
  parentId: DatabaseId | null;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const ItemCategorySchema = SchemaFactory.createForClass(ItemCategory);
ItemCategorySchema.index({ name: 1 });

@Schema({ timestamps: true })
export class Uom extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: DatabaseId, ref: 'Uom', default: null })
  baseUomId: DatabaseId | null;

  @Prop({ type: Number, min: 0.000001, default: 1 })
  conversionFactor: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const UomSchema = SchemaFactory.createForClass(Uom);
UomSchema.index({ name: 1 });

@Schema({ timestamps: true })
export class Item extends Document {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: DatabaseId, ref: 'ItemCategory', required: true })
  categoryId: DatabaseId;

  @Prop({ type: DatabaseId, ref: 'Uom', required: true })
  uomId: DatabaseId;

  @Prop({ enum: ItemType, required: true })
  itemType: ItemType;

  @Prop({ type: Number, min: 0, default: 0 })
  standardCost: number;

  @Prop({ type: Number, min: 0, default: 0 })
  sellingPrice: number;

  @Prop({ trim: true })
  hsnSac: string;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  taxPercent: number;

  @Prop({ default: true })
  isStockItem: boolean;

  @Prop({ type: Number, min: 0, default: 0 })
  reorderLevel: number;

  @Prop({ type: DatabaseId, ref: 'Supplier', default: null })
  defaultSupplierId: DatabaseId | null;

  @Prop({ type: Number, min: 0, default: 0 })
  leadTimeDays: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
ItemSchema.index({ name: 1 });
ItemSchema.index({ categoryId: 1, isActive: 1 });
ItemSchema.index({ itemType: 1, isStockItem: 1 });