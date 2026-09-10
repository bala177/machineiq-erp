import { BadRequestException } from '@nestjs/common';
import { ItemsService } from './items.service';

describe('ItemsService item policy', () => {
  const service = (preferences: any) => new ItemsService(
    {} as any, {} as any, {} as any, {} as any, {} as any,
    { get: jest.fn().mockResolvedValue({ key: 'item_preferences', value: preferences }) } as any,
  ) as any;

  it('applies controlled defaults to a new item', async () => {
    const result = await service({ salesEnabled: false, purchaseEnabled: true, isStockItem: false, taxPercent: 12, requireHsnSac: false })
      .applyItemPreferences({ name: 'Bearing' });
    expect(result).toEqual(expect.objectContaining({ salesEnabled: false, purchaseEnabled: true, isStockItem: false, taxPercent: 12 }));
  });

  it('enforces the configured HSN/SAC requirement', async () => {
    await expect(service({ salesEnabled: true, purchaseEnabled: true, isStockItem: true, taxPercent: 18, requireHsnSac: true })
      .applyItemPreferences({ name: 'Bearing' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
