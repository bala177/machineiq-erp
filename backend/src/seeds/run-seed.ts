import * as bcrypt from 'bcrypt';
import dataSource from '../database/data-source';
import {
  BranchEntity, CompanyEntity, CustomerEntity, DepartmentEntity, DocumentTypeEntity,
  ItemCategoryEntity, ItemEntity, LocationEntity, PermissionEntity, RolePermissionEntity,
  SequenceEntity, SupplierEntity, SystemSettingEntity, UomEntity, UserEntity,
} from '../database/entities/release1.entity';
import { RuntimeDocumentEntity } from '../database/entities/runtime-document.entity';
import { Role } from '../common/enums';
import { ItemType } from '../schemas/item.schema';
import { LocationType } from '../schemas/organization.schema';
import { NumberResetFrequency } from '../schemas/document-type.schema';

const demoMode = process.argv.includes('--demo');

async function seed() {
  await dataSource.initialize();
  await dataSource.runMigrations();

  const departments = dataSource.getRepository(DepartmentEntity);
  for (const [code, name] of [
    ['MECH', 'Mechanical Engineering'], ['ELEC', 'Electrical Engineering'],
    ['CTRL', 'Controls & Software'], ['PROC', 'Procurement'],
    ['SALE', 'Sales'], ['PM', 'Project Management'],
  ]) await departments.upsert({ code, name, description: null, isActive: true }, { conflictPaths: ['name'] });

  const permissions = dataSource.getRepository(PermissionEntity);
  for (const [code, module, action] of [
    ['items.manage', 'Items', 'Manage'], ['customers.manage', 'Customers', 'Manage'],
    ['suppliers.manage', 'Suppliers', 'Manage'], ['organization.manage', 'Organization', 'Manage'],
    ['permissions.manage', 'Access Control', 'Manage'], ['document-types.manage', 'Document Types', 'Manage'],
    ['components.link-item', 'Components', 'Link Item'],
  ]) await permissions.upsert({ code, module, action, description: `${action} ${module}`, isActive: true }, { conflictPaths: ['code'] });
  const rolePermissions = dataSource.getRepository(RolePermissionEntity);
  for (const permission of await permissions.find()) {
    await rolePermissions.upsert({ role: Role.ADMIN, permissionId: permission._id, allowed: true }, { conflictPaths: ['role', 'permissionId'] });
  }

  const documentTypes = dataSource.getRepository(DocumentTypeEntity);
  for (const type of [
    { code: 'quote', name: 'Quote', prefix: 'QTE' },
    { code: 'invoice', name: 'Invoice', prefix: 'INV' },
  ]) await documentTypes.upsert({ ...type, padding: 4, resetFrequency: NumberResetFrequency.YEARLY, nextNumber: '1', lastPeriod: '', isActive: true }, { conflictPaths: ['code'] });

  const companies = dataSource.getRepository(CompanyEntity);
  await companies.upsert({
    code: 'MIQ', name: 'MachineIQ Manufacturing Pvt. Ltd.', email: 'operations@machineiq.com',
    phone: '+91 80 5555 0100', website: 'https://machineiq.tech', taxRegistrationNumber: '29AABCM1234F1Z5',
    registrationNumber: 'U29299KA2026PTC000001', baseCurrency: 'INR', timezone: 'Asia/Kolkata',
    address: 'Peenya Industrial Area', city: 'Bengaluru', stateProvince: 'Karnataka', postalCode: '560058',
    country: 'India', isActive: true,
  }, { conflictPaths: ['code'] });
  const company = await companies.findOneByOrFail({ code: 'MIQ' });

  const branches = dataSource.getRepository(BranchEntity);
  await branches.upsert({
    code: 'BLR-HQ', name: 'Bengaluru Headquarters', companyId: company._id,
    taxRegistrationNumber: company.taxRegistrationNumber, email: 'blr@machineiq.com', phone: company.phone,
    address: company.address, city: company.city, stateProvince: company.stateProvince,
    postalCode: company.postalCode, country: company.country, isActive: true,
  }, { conflictPaths: ['code'] });
  const branch = await branches.findOneByOrFail({ code: 'BLR-HQ' });
  await dataSource.getRepository(LocationEntity).upsert({
    code: 'BLR-PLANT', name: 'Bengaluru Assembly Plant', branchId: branch._id, type: LocationType.FACTORY,
    address: branch.address, city: branch.city, stateProvince: branch.stateProvince,
    postalCode: branch.postalCode, country: branch.country, isActive: true,
  }, { conflictPaths: ['code'] });

  const suppliers = dataSource.getRepository(SupplierEntity);
  await suppliers.upsert({
    code: 'SUP-00001', name: 'Precision Motion Systems', contactPerson: 'Ravi Kumar',
    email: 'sales@precisionmotion.example', phone: '+91 80 5555 0190', address: 'Bengaluru',
    category: 'Motion Control', paymentTerms: 'Net 30', taxRegistrationNumber: '29AABCP0001F1Z1',
    currencyCode: 'INR', bankDetails: {}, qualificationStatus: 'approved', defaultLeadTimeDays: 35, isActive: true,
  }, { conflictPaths: ['code'] });
  const supplier = await suppliers.findOneByOrFail({ code: 'SUP-00001' });

  const categories = dataSource.getRepository(ItemCategoryEntity);
  await categories.upsert({ code: 'MECH', name: 'Mechanical Components', parentId: null, isActive: true }, { conflictPaths: ['code'] });
  await categories.upsert({ code: 'ELEC', name: 'Electrical Components', parentId: null, isActive: true }, { conflictPaths: ['code'] });
  const electrical = await categories.findOneByOrFail({ code: 'ELEC' });
  const uoms = dataSource.getRepository(UomEntity);
  await uoms.upsert({ code: 'EA', name: 'Each', baseUomId: null, conversionFactor: 1, isActive: true }, { conflictPaths: ['code'] });
  const each = await uoms.findOneByOrFail({ code: 'EA' });

  await dataSource.getRepository(ItemEntity).upsert({
    code: 'SRV-MTR-2KW', name: 'Servo Motor 2 kW', description: 'High-torque servo motor',
    categoryId: electrical._id, uomId: each._id, itemType: ItemType.COMPONENT,
    standardCost: 68000, sellingPrice: 82500, hsnSac: '85015220', taxPercent: 18,
    isStockItem: true, reorderLevel: 4, defaultSupplierId: supplier._id, leadTimeDays: 42, isActive: true,
  }, { conflictPaths: ['code'] });

  await dataSource.getRepository(SequenceEntity).upsert(
    [{ key: 'customer', value: '0' }, { key: 'supplier', value: '1' }], { conflictPaths: ['key'] },
  );
  await dataSource.getRepository(SystemSettingEntity).upsert({
    key: 'commercial_preferences',
    value: { organizationName: 'MachineIQ', machineSegment: 'OEM machine builders', baseCurrency: 'INR' },
  }, { conflictPaths: ['key'] });

  if (demoMode) await seedDemo();
  console.log(`PostgreSQL seed complete (${demoMode ? 'client demo' : 'master data only; first-user setup remains open'}).`);
}

async function seedDemo() {
  const users = dataSource.getRepository(UserEntity);
  const pmDepartment = await dataSource.getRepository(DepartmentEntity).findOneByOrFail({ code: 'PM' });
  const password = await bcrypt.hash('ChangeMe123!', 12);
  await users.upsert({
    firstName: 'Client', lastName: 'Reviewer', email: 'reviewer@machineiq.local', password,
    role: Role.ADMIN, departmentId: pmDepartment._id, title: 'Release 1 Reviewer', phone: null, isActive: true,
  }, { conflictPaths: ['email'] });
  const reviewer = await users.findOneByOrFail({ email: 'reviewer@machineiq.local' });

  const customers = dataSource.getRepository(CustomerEntity);
  await customers.upsert({
    code: 'CUS-00001', name: 'Atlas Beverage Systems', accountType: 'customer', customerType: 'business',
    displayName: 'Atlas Beverage', companySize: 'medium', industry: 'Food & Beverage', website: null,
    contactPerson: 'Nina Alvarez', email: 'nina@atlasbev.example', phone: '+1-555-0199', mobile: null,
    designation: 'Engineering Director', department: 'Engineering', secondaryContactName: null,
    secondaryContactEmail: null, secondaryContactPhone: null, address: '100 Industrial Drive', city: 'Chicago',
    stateProvince: 'Illinois', postalCode: '60601', country: 'USA', shippingAddress: null, shippingCity: null,
    shippingStateProvince: null, shippingPostalCode: null, shippingCountry: null, vatNumber: null,
    taxTreatment: null, placeOfSupply: null, registrationNumber: null, paymentTerms: 'Net 30', currencyCode: 'USD',
    creditLimit: 250000, priceList: null, deliveryTerms: 'FCA', notes: 'Deterministic Release 1 review customer',
  }, { conflictPaths: ['code'] });
  const customer = await customers.findOneByOrFail({ code: 'CUS-00001' });
  await dataSource.getRepository(SequenceEntity).upsert({ key: 'customer', value: '1' }, { conflictPaths: ['key'] });

  const documents = dataSource.getRepository(RuntimeDocumentEntity);
  if (!(await documents.findOne({ where: { domain: 'Project' } }))) {
    const project = await documents.save(documents.create({
      domain: 'Project', deletedAt: null,
      data: { projectNo: 'PRJ-2026-0001', name: 'Atlas High-Speed Packaging Cell', customerId: customer._id,
        projectManagerId: reviewer._id, stage: 'engineering', health: 'healthy', priority: 'high',
        description: 'Deterministic client-review project', teamMembers: [reviewer._id], milestones: [] },
    }));
    await documents.save(documents.create({ domain: 'Machine', deletedAt: null,
      data: { projectId: project._id, name: 'Cartoning and Case Packing Cell', description: 'Release 1 demo machine', status: 'in_progress' } }));
    await documents.save(documents.create({ domain: 'Task', deletedAt: null,
      data: { projectId: project._id, title: 'Complete mechanical design review', status: 'in_progress', priority: 'high', ownerId: reviewer._id, departmentId: pmDepartment._id } }));
  }
}

seed().then(() => dataSource.destroy()).catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
