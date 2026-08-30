import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import * as XLSX from 'xlsx';
import { Customer } from '../../schemas/customer.schema';
import { CreateCustomerDto, UpdateCustomerDto } from './customers.dto';
import { SequencesService } from '../sequences/sequences.service';

const VALID_ACCOUNT_TYPES = ['prospect', 'active', 'inactive', 'churned'];
const VALID_COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1001+'];

// Maps every reasonable column header variant to the canonical field name
const HEADER_MAP: Record<string, string> = {
  name: 'name',
  company: 'name',
  'company name': 'name',
  accounttype: 'accountType',
  'account type': 'accountType',
  type: 'accountType',
  status: 'accountType',
  customertype: 'customerType',
  'customer type': 'customerType',
  displayname: 'displayName',
  'display name': 'displayName',
  companysize: 'companySize',
  'company size': 'companySize',
  size: 'companySize',
  employees: 'companySize',
  headcount: 'companySize',
  industry: 'industry',
  sector: 'industry',
  website: 'website',
  url: 'website',
  web: 'website',
  contactperson: 'contactPerson',
  'contact person': 'contactPerson',
  contact: 'contactPerson',
  'primary contact': 'contactPerson',
  'contact name': 'contactPerson',
  email: 'email',
  'contact email': 'email',
  'primary email': 'email',
  phone: 'phone',
  'contact phone': 'phone',
  'phone number': 'phone',
  'primary phone': 'phone',
  telephone: 'phone',
  mobile: 'mobile',
  cellphone: 'mobile',
  designation: 'designation',
  title: 'designation',
  department: 'department',
  secondarycontactname: 'secondaryContactName',
  'secondary contact name': 'secondaryContactName',
  'secondary contact': 'secondaryContactName',
  'alt contact': 'secondaryContactName',
  secondarycontactemail: 'secondaryContactEmail',
  'secondary contact email': 'secondaryContactEmail',
  'secondary email': 'secondaryContactEmail',
  'alt email': 'secondaryContactEmail',
  secondarycontactphone: 'secondaryContactPhone',
  'secondary contact phone': 'secondaryContactPhone',
  'secondary phone': 'secondaryContactPhone',
  'alt phone': 'secondaryContactPhone',
  address: 'address',
  'street address': 'address',
  street: 'address',
  'address line 1': 'address',
  city: 'city',
  town: 'city',
  stateprovince: 'stateProvince',
  'state/province': 'stateProvince',
  state: 'stateProvince',
  province: 'stateProvince',
  region: 'stateProvince',
  postalcode: 'postalCode',
  'postal code': 'postalCode',
  zip: 'postalCode',
  'zip code': 'postalCode',
  postcode: 'postalCode',
  country: 'country',
  nation: 'country',
  shippingaddress: 'shippingAddress',
  'shipping address': 'shippingAddress',
  shippingcity: 'shippingCity',
  'shipping city': 'shippingCity',
  shippingstateprovince: 'shippingStateProvince',
  'shipping state/province': 'shippingStateProvince',
  'shipping state': 'shippingStateProvince',
  shippingpostalcode: 'shippingPostalCode',
  'shipping postal code': 'shippingPostalCode',
  'shipping zip': 'shippingPostalCode',
  shippingcountry: 'shippingCountry',
  'shipping country': 'shippingCountry',
  vatnumber: 'vatNumber',
  'vat number': 'vatNumber',
  vat: 'vatNumber',
  'tax id': 'vatNumber',
  taxid: 'vatNumber',
  'tax number': 'vatNumber',
  taxtreatment: 'taxTreatment',
  'tax treatment': 'taxTreatment',
  placeofsupply: 'placeOfSupply',
  'place of supply': 'placeOfSupply',
  registrationnumber: 'registrationNumber',
  'registration number': 'registrationNumber',
  'reg number': 'registrationNumber',
  'company reg': 'registrationNumber',
  paymentterms: 'paymentTerms',
  'payment terms': 'paymentTerms',
  payment: 'paymentTerms',
  terms: 'paymentTerms',
  currency: 'currencyCode',
  currencycode: 'currencyCode',
  'currency code': 'currencyCode',
  creditlimit: 'creditLimit',
  'credit limit': 'creditLimit',
  pricelist: 'priceList',
  'price list': 'priceList',
  deliveryterms: 'deliveryTerms',
  'delivery terms': 'deliveryTerms',
  notes: 'notes',
  note: 'notes',
  comments: 'notes',
  remarks: 'notes',
};

@Injectable()
export class CustomersService {
  constructor(
    @InjectPgModel(Customer.name) private customerModel: Model<Customer>,
    private sequencesService: SequencesService,
  ) {}

  async create(dto: CreateCustomerDto) {
    await this.assertNameAvailable(dto.name);
    const code = await this.generateCode();
    const customer = await this.customerModel.create({
      ...dto,
      code,
      displayName: dto.displayName || dto.name,
      currencyCode: dto.currencyCode || 'INR',
    });
    return customer;
  }

  async findAll(query: { search?: string } = {}) {
    const filter: any = { deletedAt: null };
    if (query.search) {
      const expression = { $regex: query.search.trim(), $options: 'i' };
      filter.$or = [{ code: expression }, { name: expression }, { contactPerson: expression }, { email: expression }, { industry: expression }, { country: expression }, { city: expression }];
    }
    return this.customerModel.find(filter).sort({ name: 1 }).exec();
  }

  async findById(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Customer not found');
    const customer = await this.customerModel.findOne({ _id: id, deletedAt: null });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Customer not found');
    if (dto.name) {
      await this.assertNameAvailable(dto.name, id);
    }
    const customer = await this.customerModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: dto }, { new: true });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async softDelete(id: string) {
    if (!DatabaseId.isValid(id)) throw new NotFoundException('Customer not found');
    await this.customerModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } });
    return { message: 'Customer deleted' };
  }

  async bulkImport(buffer: Buffer, originalname: string) {
    const ext = (originalname.split('.').pop() ?? '').toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      throw new BadRequestException('Only .csv, .xlsx, and .xls files are supported');
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as { row: number; name: string; reason: string }[],
    };

    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];
      const rowNum = i + 2; // 1-indexed with header offset

      // Map raw headers to canonical field names
      const row: Record<string, string> = {};
      for (const [key, value] of Object.entries(rawRow)) {
        const canonical = HEADER_MAP[key.toLowerCase().trim()];
        if (canonical) {
          const str = String(value).trim();
          if (str) row[canonical] = str;
        }
      }

      const name = row['name'] ?? '';
      if (!name) {
        results.errors.push({ row: rowNum, name: '—', reason: 'Missing required field: name' });
        results.skipped++;
        continue;
      }

      // Validate email format
      if (row['email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['email'])) {
        results.errors.push({ row: rowNum, name, reason: `Invalid email format: "${row['email']}"` });
        results.skipped++;
        continue;
      }

      // Validate secondary email format
      if (row['secondaryContactEmail'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['secondaryContactEmail'])) {
        results.errors.push({ row: rowNum, name, reason: `Invalid secondary email format: "${row['secondaryContactEmail']}"` });
        results.skipped++;
        continue;
      }

      // Normalize accountType — default to 'prospect' if unrecognised
      if (row['accountType']) {
        const normalized = row['accountType'].toLowerCase();
        row['accountType'] = VALID_ACCOUNT_TYPES.includes(normalized) ? normalized : 'prospect';
      }

      // Drop companySize if value is not a recognized enum
      if (row['companySize'] && !VALID_COMPANY_SIZES.includes(row['companySize'])) {
        delete row['companySize'];
      }

      // Normalize website: prepend https:// if protocol is missing
      if (row['website'] && !/^https?:\/\//i.test(row['website'])) {
        row['website'] = `https://${row['website']}`;
      }

      try {
        await this.create(row as unknown as CreateCustomerDto);
        results.created++;
      } catch (err: any) {
        results.errors.push({ row: rowNum, name, reason: err.message ?? 'Failed to create' });
        results.skipped++;
      }
    }

    return results;
  }

  private async assertNameAvailable(name: string, excludeId?: string) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await this.customerModel.findOne({
      deletedAt: null,
      name: { $regex: `^${escapedName}$`, $options: 'i' },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });

    if (existing) {
      throw new BadRequestException('A customer with this name already exists');
    }
  }

  private async generateCode() {
    const value = await this.sequencesService.next('customer');
    return `CUS-${String(value).padStart(5, '0')}`;
  }
}
