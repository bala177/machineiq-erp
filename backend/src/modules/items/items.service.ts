import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Item, ItemCategory, Uom } from '../../schemas/item.schema';
import { CreateItemCategoryDto, CreateItemDto, CreateUomDto, UpdateItemCategoryDto, UpdateItemDto, UpdateUomDto } from './items.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectPgModel(Item.name) private itemModel: Model<Item>,
    @InjectPgModel(ItemCategory.name) private categoryModel: Model<ItemCategory>,
    @InjectPgModel(Uom.name) private uomModel: Model<Uom>,
    private auditLogService: AuditLogService,
  ) {}

  async createItem(dto: CreateItemDto, userId: string) {
    await this.assertCodeAvailable(this.itemModel, dto.code, 'Item');
    await this.requireActive(this.categoryModel, dto.categoryId, 'Item category');
    await this.requireActive(this.uomModel, dto.uomId, 'UOM');
    const item = await this.itemModel.create(dto);
    await this.auditLogService.log({ action: 'create', entityType: 'Item', entityId: item._id, performedBy: userId, newValues: item.toObject() });
    return item.populate([{ path: 'categoryId', select: 'code name' }, { path: 'uomId', select: 'code name' }]);
  }

  async findItems(query: { search?: string; categoryId?: string; itemType?: string }) {
    const filter: Record<string, unknown> = { deletedAt: null };
    if (query.search?.trim()) {
      const expression = { $regex: query.search.trim(), $options: 'i' };
      filter.$or = [{ code: expression }, { name: expression }, { description: expression }];
    }
    if (query.categoryId && DatabaseId.isValid(query.categoryId)) filter.categoryId = query.categoryId;
    if (query.itemType) filter.itemType = query.itemType;
    return this.itemModel.find(filter).populate('categoryId', 'code name').populate('uomId', 'code name').populate('defaultSupplierId', 'code name').sort({ code: 1 }).exec();
  }

  async updateItem(id: string, dto: UpdateItemDto, userId: string) {
    const existing = await this.findItem(id);
    if (dto.categoryId) await this.requireActive(this.categoryModel, dto.categoryId, 'Item category');
    if (dto.uomId) await this.requireActive(this.uomModel, dto.uomId, 'UOM');
    const item = await this.itemModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: dto }, { new: true });
    await this.auditLogService.log({ action: 'update', entityType: 'Item', entityId: id, performedBy: userId, previousValues: existing.toObject(), newValues: dto });
    return item;
  }

  async deleteItem(id: string, userId: string) {
    const existing = await this.findItem(id);
    await this.itemModel.updateOne({ _id: id }, { $set: { deletedAt: new Date(), isActive: false } });
    await this.auditLogService.log({ action: 'delete', entityType: 'Item', entityId: id, performedBy: userId, previousValues: existing.toObject() });
    return { message: 'Item deleted' };
  }

  async createCategory(dto: CreateItemCategoryDto, userId: string) {
    await this.assertCodeAvailable(this.categoryModel, dto.code, 'Item category');
    if (dto.parentId) await this.requireActive(this.categoryModel, dto.parentId, 'Parent category');
    const category = await this.categoryModel.create(dto);
    await this.auditLogService.log({ action: 'create', entityType: 'ItemCategory', entityId: category._id, performedBy: userId, newValues: category.toObject() });
    return category;
  }

  findCategories() {
    return this.categoryModel.find({ deletedAt: null }).populate('parentId', 'code name').sort({ code: 1 }).exec();
  }

  async updateCategory(id: string, dto: UpdateItemCategoryDto, userId: string) {
    const existing = await this.requireDocument(this.categoryModel, id, 'Item category');
    if (dto.parentId) {
      if (dto.parentId === id) throw new ConflictException('An item category cannot be its own parent');
      await this.requireActive(this.categoryModel, dto.parentId, 'Parent category');
    }
    const category = await this.categoryModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    await this.auditLogService.log({ action: 'update', entityType: 'ItemCategory', entityId: id, performedBy: userId, previousValues: existing.toObject(), newValues: dto });
    return category;
  }

  async deleteCategory(id: string, userId: string) {
    const existing = await this.requireDocument(this.categoryModel, id, 'Item category');
    if (await this.itemModel.exists({ categoryId: id, deletedAt: null })) throw new ConflictException('Item category is used by active items');
    if (await this.categoryModel.exists({ parentId: id, deletedAt: null })) throw new ConflictException('Item category has active child categories');
    await this.categoryModel.updateOne({ _id: id }, { $set: { deletedAt: new Date(), isActive: false } });
    await this.auditLogService.log({ action: 'delete', entityType: 'ItemCategory', entityId: id, performedBy: userId, previousValues: existing.toObject() });
    return { message: 'Item category deleted' };
  }

  async createUom(dto: CreateUomDto, userId: string) {
    await this.assertCodeAvailable(this.uomModel, dto.code, 'UOM');
    if (dto.baseUomId) await this.requireActive(this.uomModel, dto.baseUomId, 'Base UOM');
    const uom = await this.uomModel.create(dto);
    await this.auditLogService.log({ action: 'create', entityType: 'Uom', entityId: uom._id, performedBy: userId, newValues: uom.toObject() });
    return uom;
  }

  findUoms() {
    return this.uomModel.find({ deletedAt: null }).populate('baseUomId', 'code name').sort({ code: 1 }).exec();
  }

  async updateUom(id: string, dto: UpdateUomDto, userId: string) {
    const existing = await this.requireDocument(this.uomModel, id, 'UOM');
    if (dto.baseUomId) {
      if (dto.baseUomId === id) throw new ConflictException('A UOM cannot be its own base');
      await this.requireActive(this.uomModel, dto.baseUomId, 'Base UOM');
    }
    const uom = await this.uomModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    await this.auditLogService.log({ action: 'update', entityType: 'Uom', entityId: id, performedBy: userId, previousValues: existing.toObject(), newValues: dto });
    return uom;
  }

  async deleteUom(id: string, userId: string) {
    const existing = await this.requireDocument(this.uomModel, id, 'UOM');
    if (await this.itemModel.exists({ uomId: id, deletedAt: null })) throw new ConflictException('UOM is used by active items');
    if (await this.uomModel.exists({ baseUomId: id, deletedAt: null })) throw new ConflictException('UOM is used as an active base UOM');
    await this.uomModel.updateOne({ _id: id }, { $set: { deletedAt: new Date(), isActive: false } });
    await this.auditLogService.log({ action: 'delete', entityType: 'Uom', entityId: id, performedBy: userId, previousValues: existing.toObject() });
    return { message: 'UOM deleted' };
  }

  async findItem(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Item not found');
    const item = await this.itemModel.findOne({ _id: id, deletedAt: null });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  private async assertCodeAvailable(model: Model<any>, code: string, label: string) {
    if (await model.exists({ code: code.toUpperCase(), deletedAt: null })) throw new ConflictException(`${label} code already exists`);
  }

  private async requireActive(model: Model<any>, id: string, label: string) {
    if (!DatabaseId.isValid(id) || !(await model.exists({ _id: id, deletedAt: null, isActive: true }))) throw new NotFoundException(`${label} not found`);
  }

  private async requireDocument(model: Model<any>, id: string, label: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException(`${label} not found`);
    const document = await model.findOne({ _id: id, deletedAt: null });
    if (!document) throw new NotFoundException(`${label} not found`);
    return document;
  }
}
