import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Role } from '../../common/enums';
import { ItemType } from '../../schemas/item.schema';
import { LocationType } from '../../schemas/organization.schema';
import { NumberResetFrequency } from '../../schemas/document-type.schema';
import { BaseEntity } from './base.entity';

const moneyTransformer = {
  to: (value: number) => value,
  from: (value: string) => Number(value),
};

abstract class MigratedEntity extends BaseEntity {
}

@Entity('departments')
export class DepartmentEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 160, unique: true }) name: string;
  @Column({ type: 'varchar', length: 40, nullable: true }) code: string | null;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
  @OneToMany(() => UserEntity, (user) => user.department) users: UserEntity[];
}

@Entity('users')
@Index(['role'])
export class UserEntity extends MigratedEntity {
  @Column({ name: 'first_name', type: 'varchar', length: 120 }) firstName: string;
  @Column({ name: 'last_name', type: 'varchar', length: 120 }) lastName: string;
  @Column({ type: 'varchar', length: 320, unique: true }) email: string;
  @Column({ name: 'password_hash', type: 'text', select: false }) password: string;
  @Column({ type: 'enum', enum: Role, default: Role.DESIGNER }) role: Role;
  @Column({ name: 'department_id', type: 'uuid', nullable: true }) departmentId: string | null;
  @ManyToOne(() => DepartmentEntity, (department) => department.users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' }) department: DepartmentEntity | null;
  @Column({ type: 'varchar', length: 160, nullable: true }) title: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) phone: string | null;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}

@Entity('permissions')
@Unique(['module', 'action'])
export class PermissionEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 160, unique: true }) code: string;
  @Column({ type: 'varchar', length: 120 }) module: string;
  @Column({ type: 'varchar', length: 120 }) action: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}

@Entity('role_permissions')
@Unique(['role', 'permissionId'])
export class RolePermissionEntity extends BaseEntity {
  @Column({ type: 'enum', enum: Role }) role: Role;
  @Column({ name: 'permission_id', type: 'uuid' }) permissionId: string;
  @ManyToOne(() => PermissionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' }) permission: PermissionEntity;
  @Column({ default: true }) allowed: boolean;
}

@Entity('companies')
export class CompanyEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ type: 'varchar', length: 40, unique: true }) code: string;
  @Column({ type: 'varchar', length: 320, nullable: true }) email: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) phone: string | null;
  @Column({ type: 'varchar', length: 500, nullable: true }) website: string | null;
  @Column({ name: 'tax_registration_number', type: 'varchar', length: 80, nullable: true }) taxRegistrationNumber: string | null;
  @Column({ name: 'registration_number', type: 'varchar', length: 80, nullable: true }) registrationNumber: string | null;
  @Column({ name: 'base_currency', type: 'varchar', length: 8, default: 'INR' }) baseCurrency: string;
  @Column({ type: 'varchar', length: 80, default: 'Asia/Kolkata' }) timezone: string;
  @Column({ type: 'text', nullable: true }) address: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) city: string | null;
  @Column({ name: 'state_province', type: 'varchar', length: 120, nullable: true }) stateProvince: string | null;
  @Column({ name: 'postal_code', type: 'varchar', length: 24, nullable: true }) postalCode: string | null;
  @Column({ type: 'varchar', length: 120, default: 'India' }) country: string;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}

@Entity('branches')
@Index(['companyId', 'name'])
export class BranchEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 40, unique: true }) code: string;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
  @ManyToOne(() => CompanyEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id' }) company: CompanyEntity;
  @Column({ name: 'tax_registration_number', type: 'varchar', length: 80, nullable: true }) taxRegistrationNumber: string | null;
  @Column({ type: 'varchar', length: 320, nullable: true }) email: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) phone: string | null;
  @Column({ type: 'text', nullable: true }) address: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) city: string | null;
  @Column({ name: 'state_province', type: 'varchar', length: 120, nullable: true }) stateProvince: string | null;
  @Column({ name: 'postal_code', type: 'varchar', length: 24, nullable: true }) postalCode: string | null;
  @Column({ type: 'varchar', length: 120, default: 'India' }) country: string;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}

@Entity('locations')
@Index(['branchId', 'type'])
export class LocationEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 40, unique: true }) code: string;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ name: 'branch_id', type: 'uuid' }) branchId: string;
  @ManyToOne(() => BranchEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' }) branch: BranchEntity;
  @Column({ type: 'enum', enum: LocationType, default: LocationType.OFFICE }) type: LocationType;
  @Column({ type: 'text', nullable: true }) address: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) city: string | null;
  @Column({ name: 'state_province', type: 'varchar', length: 120, nullable: true }) stateProvince: string | null;
  @Column({ name: 'postal_code', type: 'varchar', length: 24, nullable: true }) postalCode: string | null;
  @Column({ type: 'varchar', length: 120, default: 'India' }) country: string;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}

@Entity('customers')
@Index(['name'])
@Index(['accountType'])
export class CustomerEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 40, unique: true }) code: string;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ name: 'account_type', type: 'varchar', length: 20, default: 'prospect' }) accountType: string;
  @Column({ name: 'customer_type', type: 'varchar', length: 20, default: 'business' }) customerType: string;
  @Column({ name: 'display_name', type: 'varchar', length: 200, nullable: true }) displayName: string | null;
  @Column({ name: 'company_size', type: 'varchar', length: 20, nullable: true }) companySize: string | null;
  @Column({ type: 'varchar', length: 160, nullable: true }) industry: string | null;
  @Column({ type: 'varchar', length: 500, nullable: true }) website: string | null;
  @Column({ name: 'contact_person', type: 'varchar', length: 200, nullable: true }) contactPerson: string | null;
  @Column({ type: 'varchar', length: 320, nullable: true }) email: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) phone: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) mobile: string | null;
  @Column({ type: 'varchar', length: 160, nullable: true }) designation: string | null;
  @Column({ type: 'varchar', length: 160, nullable: true }) department: string | null;
  @Column({ name: 'secondary_contact_name', type: 'varchar', length: 200, nullable: true }) secondaryContactName: string | null;
  @Column({ name: 'secondary_contact_email', type: 'varchar', length: 320, nullable: true }) secondaryContactEmail: string | null;
  @Column({ name: 'secondary_contact_phone', type: 'varchar', length: 40, nullable: true }) secondaryContactPhone: string | null;
  @Column({ type: 'text', nullable: true }) address: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) city: string | null;
  @Column({ name: 'state_province', type: 'varchar', length: 120, nullable: true }) stateProvince: string | null;
  @Column({ name: 'postal_code', type: 'varchar', length: 24, nullable: true }) postalCode: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) country: string | null;
  @Column({ name: 'shipping_address', type: 'text', nullable: true }) shippingAddress: string | null;
  @Column({ name: 'shipping_city', type: 'varchar', length: 120, nullable: true }) shippingCity: string | null;
  @Column({ name: 'shipping_state_province', type: 'varchar', length: 120, nullable: true }) shippingStateProvince: string | null;
  @Column({ name: 'shipping_postal_code', type: 'varchar', length: 24, nullable: true }) shippingPostalCode: string | null;
  @Column({ name: 'shipping_country', type: 'varchar', length: 120, nullable: true }) shippingCountry: string | null;
  @Column({ name: 'vat_number', type: 'varchar', length: 80, nullable: true }) vatNumber: string | null;
  @Column({ name: 'tax_treatment', type: 'varchar', length: 120, nullable: true }) taxTreatment: string | null;
  @Column({ name: 'place_of_supply', type: 'varchar', length: 120, nullable: true }) placeOfSupply: string | null;
  @Column({ name: 'registration_number', type: 'varchar', length: 80, nullable: true }) registrationNumber: string | null;
  @Column({ name: 'payment_terms', type: 'varchar', length: 120, nullable: true }) paymentTerms: string | null;
  @Column({ name: 'currency_code', type: 'varchar', length: 8, default: 'INR' }) currencyCode: string;
  @Column({ name: 'credit_limit', type: 'numeric', precision: 18, scale: 4, default: 0, transformer: moneyTransformer }) creditLimit: number;
  @Column({ name: 'price_list', type: 'varchar', length: 120, nullable: true }) priceList: string | null;
  @Column({ name: 'delivery_terms', type: 'varchar', length: 200, nullable: true }) deliveryTerms: string | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;
}

@Entity('suppliers')
@Index(['name'])
export class SupplierEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 40, unique: true }) code: string;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ name: 'contact_person', type: 'varchar', length: 200, nullable: true }) contactPerson: string | null;
  @Column({ type: 'varchar', length: 320, nullable: true }) email: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) phone: string | null;
  @Column({ type: 'text', nullable: true }) address: string | null;
  @Column({ type: 'varchar', length: 160, nullable: true }) category: string | null;
  @Column({ name: 'payment_terms', type: 'varchar', length: 120, nullable: true }) paymentTerms: string | null;
  @Column({ name: 'tax_registration_number', type: 'varchar', length: 80, nullable: true }) taxRegistrationNumber: string | null;
  @Column({ name: 'currency_code', type: 'varchar', length: 8, default: 'INR' }) currencyCode: string;
  @Column({ name: 'bank_details', type: 'jsonb', default: () => "'{}'::jsonb" }) bankDetails: Record<string, string>;
  @Column({ name: 'qualification_status', type: 'varchar', length: 20, default: 'pending' }) qualificationStatus: string;
  @Column({ name: 'default_lead_time_days', type: 'integer', default: 0 }) defaultLeadTimeDays: number;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}

@Entity('item_categories')
@Index(['name'])
export class ItemCategoryEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 40, unique: true }) code: string;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ name: 'parent_id', type: 'uuid', nullable: true }) parentId: string | null;
  @ManyToOne(() => ItemCategoryEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parent_id' }) parent: ItemCategoryEntity | null;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}

@Entity('uoms')
@Check('CHK_uoms_conversion_factor', 'conversion_factor > 0')
export class UomEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 40, unique: true }) code: string;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ name: 'base_uom_id', type: 'uuid', nullable: true }) baseUomId: string | null;
  @ManyToOne(() => UomEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'base_uom_id' }) baseUom: UomEntity | null;
  @Column({ name: 'conversion_factor', type: 'numeric', precision: 18, scale: 6, default: 1, transformer: moneyTransformer }) conversionFactor: number;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}

@Entity('items')
@Index(['name'])
@Index(['categoryId', 'isActive'])
export class ItemEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 40, unique: true }) code: string;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ name: 'category_id', type: 'uuid' }) categoryId: string;
  @ManyToOne(() => ItemCategoryEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' }) category: ItemCategoryEntity;
  @Column({ name: 'uom_id', type: 'uuid' }) uomId: string;
  @ManyToOne(() => UomEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uom_id' }) uom: UomEntity;
  @Column({ name: 'item_type', type: 'enum', enum: ItemType }) itemType: ItemType;
  @Column({ name: 'standard_cost', type: 'numeric', precision: 18, scale: 4, default: 0, transformer: moneyTransformer }) standardCost: number;
  @Column({ name: 'selling_price', type: 'numeric', precision: 18, scale: 4, default: 0, transformer: moneyTransformer }) sellingPrice: number;
  @Column({ name: 'hsn_sac', type: 'varchar', length: 40, nullable: true }) hsnSac: string | null;
  @Column({ name: 'tax_percent', type: 'numeric', precision: 7, scale: 4, default: 0, transformer: moneyTransformer }) taxPercent: number;
  @Column({ name: 'is_stock_item', default: true }) isStockItem: boolean;
  @Column({ name: 'reorder_level', type: 'numeric', precision: 18, scale: 4, default: 0, transformer: moneyTransformer }) reorderLevel: number;
  @Column({ name: 'default_supplier_id', type: 'uuid', nullable: true }) defaultSupplierId: string | null;
  @ManyToOne(() => SupplierEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'default_supplier_id' }) defaultSupplier: SupplierEntity | null;
  @Column({ name: 'lead_time_days', type: 'integer', default: 0 }) leadTimeDays: number;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}

@Entity('document_types')
export class DocumentTypeEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 120, unique: true }) code: string;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ type: 'varchar', length: 40 }) prefix: string;
  @Column({ type: 'integer', default: 4 }) padding: number;
  @Column({ name: 'reset_frequency', type: 'enum', enum: NumberResetFrequency, default: NumberResetFrequency.YEARLY }) resetFrequency: NumberResetFrequency;
  @Column({ name: 'next_number', type: 'bigint', default: 1 }) nextNumber: string;
  @Column({ name: 'last_period', type: 'varchar', length: 20, default: '' }) lastPeriod: string;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}

@Entity('sequences')
export class SequenceEntity {
  @PrimaryColumn({ length: 160 }) key: string;
  @Column({ type: 'bigint', default: 0 }) value: string;
}

@Entity('system_settings')
export class SystemSettingEntity extends MigratedEntity {
  @Column({ type: 'varchar', length: 160, unique: true }) key: string;
  @Column({ type: 'jsonb' }) value: unknown;
}

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['performedBy'])
@Index(['projectId'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' }) _id: string;
  @Column({ type: 'varchar', length: 80 }) action: string;
  @Column({ name: 'entity_type', type: 'varchar', length: 120 }) entityType: string;
  @Column({ name: 'entity_id', type: 'uuid' }) entityId: string;
  @Column({ name: 'performed_by', type: 'uuid' }) performedBy: string;
  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'performed_by' }) performer: UserEntity;
  @Column({ name: 'project_id', type: 'uuid', nullable: true }) projectId: string | null;
  @Column({ name: 'previous_values', type: 'jsonb', nullable: true }) previousValues: Record<string, unknown> | null;
  @Column({ name: 'new_values', type: 'jsonb', nullable: true }) newValues: Record<string, unknown> | null;
  @Column({ name: 'ip_address', type: 'inet', nullable: true }) ipAddress: string | null;
  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' }) createdAt: Date;
}

/** All relational entities owned by the Release 1 PostgreSQL baseline. */
export const RELEASE1_ENTITIES = [
  DepartmentEntity,
  UserEntity,
  PermissionEntity,
  RolePermissionEntity,
  CompanyEntity,
  BranchEntity,
  LocationEntity,
  CustomerEntity,
  SupplierEntity,
  ItemCategoryEntity,
  UomEntity,
  ItemEntity,
  DocumentTypeEntity,
  SequenceEntity,
  SystemSettingEntity,
  AuditLogEntity,
] as const;
