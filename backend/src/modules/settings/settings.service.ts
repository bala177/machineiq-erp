import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettingEntity } from '../../database/entities/release1.entity';

const DEFAULTS: Record<string, any> = {
  notification_preferences: {
    // Only types that are actively fired by the backend:
    assignment:    true,  // task / component assigned to a user
    status_change: true,  // task status updated
    due_reminder:  true,  // approaching due date
    overdue:       true,  // past due date
  },
  platform: {
    appName: 'MachineIQ',
    version: '1.0.0',
    timezone: 'UTC',
  },
  commercial_preferences: {
    organizationName: 'MachineIQ',
    organizationEmail: 'sales@machineiq.com',
    organizationPhone: '',
    taxRegistrationNumber: '',
    billingAddress: '',
    quotePrefix: 'QTE',
    quoteNumberPadding: 4,
    defaultCurrency: 'INR',
    defaultValidityDays: 30,
    defaultTaxName: 'GST 18%',
    defaultTaxPercent: 18,
    defaultNotes: 'Thank you for your business.',
    defaultTerms: 'Payment as agreed. Quote validity is subject to technical confirmation.',
    bankDetails: '',
    units: ['Nos', 'Set', 'Lot', 'Hour', 'Day'],
    taxes: [
      { name: 'GST 0%', rate: 0 },
      { name: 'GST 5%', rate: 5 },
      { name: 'GST 12%', rate: 12 },
      { name: 'GST 18%', rate: 18 },
      { name: 'GST 28%', rate: 28 },
    ],
    items: [
      {
        name: 'Custom Machine',
        sku: 'MACHINE',
        hsnSac: '',
        unit: 'Nos',
        rate: 0,
        taxName: 'GST 18%',
        taxPercent: 18,
        description: 'Custom machine design, manufacturing, assembly, and trials.',
      },
      {
        name: 'Engineering Service',
        sku: 'ENG-SVC',
        hsnSac: '',
        unit: 'Hour',
        rate: 0,
        taxName: 'GST 18%',
        taxPercent: 18,
        description: 'Engineering, design, documentation, and commissioning support.',
      },
    ],
  },
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemSettingEntity) private settings: Repository<SystemSettingEntity>,
  ) {}

  async getAll(): Promise<Record<string, any>> {
    const settings = await this.settings.find();
    const result: Record<string, any> = { ...DEFAULTS };
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async get(key: string): Promise<any> {
    const setting = await this.settings.findOne({ where: { key } });
    if (!setting) return { key, value: DEFAULTS[key] ?? null };
    return setting;
  }

  async upsert(key: string, value: any): Promise<SystemSettingEntity> {
    await this.settings.upsert({ key, value }, { conflictPaths: ['key'] });
    return (await this.settings.findOne({ where: { key } }))!;
  }
}
