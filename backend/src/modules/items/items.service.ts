import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SequencesService } from '../sequences/sequences.service';
import { Item, ItemCategory, Uom } from '../../schemas/item.schema';
import { CreateItemCategoryDto, CreateItemDto, CreateUomDto, UpdateItemCategoryDto, UpdateItemDto, UpdateUomDto } from './items.dto';
import { pricePerBaseUom, quantityInBaseUom } from './uom-conversion';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class ItemsService {
  constructor(
    @InjectPgModel(Item.name) private itemModel: Model<Item>,
    @InjectPgModel(ItemCategory.name) private categoryModel: Model<ItemCategory>,
    @InjectPgModel(Uom.name) private uomModel: Model<Uom>,
    private auditLogService: AuditLogService,
    private sequencesService: SequencesService,
    private settingsService: SettingsService,
  ) {}

  async createItem(dto: CreateItemDto, userId: string) {
    const payload = await this.applyItemPreferences(dto);
    const code = dto.code || await this.generateCode();
    await this.assertCodeAvailable(this.itemModel, code, 'Item');
    await this.requireActive(this.categoryModel, dto.categoryId, 'Item category');
    await this.requireActive(this.uomModel, dto.uomId, 'UOM');
    const item = await this.itemModel.create({ ...payload, code });
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
    const items = await this.itemModel.find(filter).populate('categoryId', 'code name').populate('uomId', 'code name baseUomId conversionFactor').populate('defaultSupplierId', 'code name').sort({ code: 1 }).exec();
    return Promise.all(items.map((item: any) => this.withUomCalculations(item)));
  }

  async updateItem(id: string, dto: UpdateItemDto, userId: string) {
    const existing = await this.findItem(id);
    await this.assertItemPolicy({ ...existing.toObject(), ...dto });
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
    const payload = await this.normalizeUom(dto);
    const uom = await this.uomModel.create(payload);
    await this.auditLogService.log({ action: 'create', entityType: 'Uom', entityId: uom._id, performedBy: userId, newValues: uom.toObject() });
    return uom;
  }

  findUoms() {
    return this.uomModel.find({ deletedAt: null }).populate('baseUomId', 'code name').sort({ code: 1 }).exec();
  }

  async updateUom(id: string, dto: UpdateUomDto, userId: string) {
    const existing = await this.requireDocument(this.uomModel, id, 'UOM');
    const payload = await this.normalizeUom(dto, existing, id);
    const uom = await this.uomModel.findByIdAndUpdate(id, { $set: payload }, { new: true });
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

  private async generateCode() {
    const value = await this.sequencesService.next('item');
    return `ITM-${String(value).padStart(5, '0')}`;
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

  private async normalizeUom(dto: CreateUomDto | UpdateUomDto, existing?: any, id?: string) {
    const baseUomId = dto.baseUomId === undefined ? (existing?.baseUomId ?? null) : dto.baseUomId;
    const conversionFactor = dto.conversionFactor === undefined
      ? Number(existing?.conversionFactor ?? 1)
      : Number(dto.conversionFactor);

    if (!baseUomId) {
      if (conversionFactor !== 1) throw new BadRequestException('A base UOM must have a conversion factor of 1');
      return { ...dto, baseUomId: null, conversionFactor: 1 };
    }
    if (baseUomId === id) throw new ConflictException('A UOM cannot be its own base');
    if (id && !existing?.baseUomId && await this.uomModel.exists({ baseUomId: id, deletedAt: null })) {
      throw new ConflictException('This base UOM is already used by converted units');
    }
    const base = await this.requireDocument(this.uomModel, baseUomId, 'Base UOM');
    if (!base.isActive) throw new NotFoundException('Base UOM not found');
    if (base.baseUomId) throw new BadRequestException('Select a base UOM, not another converted unit');
    return { ...dto, baseUomId, conversionFactor };
  }

  private async withUomCalculations(item: any) {
    const plain = item.toObject ? item.toObject() : { ...item };
    const uom = plain.uomId;
    if (!uom || typeof uom === 'string' || !uom.baseUomId) {
      return {
        ...plain,
        reorderLevelInBaseUom: Number(plain.reorderLevel || 0),
        standardCostPerBaseUom: Number(plain.standardCost || 0),
        sellingPricePerBaseUom: Number(plain.sellingPrice || 0),
      };
    }
    const base = await this.uomModel.findOne({ _id: uom.baseUomId, deletedAt: null });
    const conversion = { baseUomId: uom.baseUomId, conversionFactor: Number(uom.conversionFactor) };
    return {
      ...plain,
      uomId: { ...uom, baseUomId: base ? { _id: base._id, code: base.code, name: base.name } : uom.baseUomId },
      reorderLevelInBaseUom: quantityInBaseUom(plain.reorderLevel, conversion),
      standardCostPerBaseUom: pricePerBaseUom(plain.standardCost, conversion),
      sellingPricePerBaseUom: pricePerBaseUom(plain.sellingPrice, conversion),
    };
  }

  private async itemPreferences() {
    const setting = await this.settingsService.get('item_preferences');
    return setting?.value ?? {};
  }

  private async applyItemPreferences(dto: CreateItemDto) {
    const preferences = await this.itemPreferences();
    const payload = {
      ...dto,
      salesEnabled: dto.salesEnabled ?? preferences.salesEnabled ?? true,
      purchaseEnabled: dto.purchaseEnabled ?? preferences.purchaseEnabled ?? true,
      isStockItem: dto.isStockItem ?? preferences.isStockItem ?? true,
      taxPercent: dto.taxPercent ?? preferences.taxPercent ?? 18,
    };
    await this.assertItemPolicy(payload, preferences);
    return payload;
  }

  private async assertItemPolicy(item: Partial<CreateItemDto>, loadedPreferences?: any) {
    const preferences = loadedPreferences ?? await this.itemPreferences();
    if (!item.salesEnabled && !item.purchaseEnabled) throw new BadRequestException('An item must be enabled for sales, purchasing, or both');
    if (preferences.requireHsnSac && !item.hsnSac?.trim()) throw new BadRequestException('HSN/SAC is required by item preferences');
  }
}
