import { BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';

describe('SettingsService item preferences', () => {
  const repository = { upsert: jest.fn(), findOne: jest.fn() };
  const service = new SettingsService(repository as any);

  beforeEach(() => jest.clearAllMocks());

  it('rejects preferences that disable both commercial uses', async () => {
    await expect(service.upsert('item_preferences', {
      salesEnabled: false, purchaseEnabled: false, isStockItem: true, taxPercent: 18, requireHsnSac: false,
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalizes and stores valid item preferences', async () => {
    repository.findOne.mockResolvedValue({ key: 'item_preferences', value: {} });
    await service.upsert('item_preferences', {
      salesEnabled: true, purchaseEnabled: false, isStockItem: true, taxPercent: '12', requireHsnSac: true,
    });
    expect(repository.upsert).toHaveBeenCalledWith(expect.objectContaining({ value: expect.objectContaining({ taxPercent: 12 }) }), { conflictPaths: ['key'] });
  });
});
