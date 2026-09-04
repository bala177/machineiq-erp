import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ItemType } from '../../schemas/item.schema';
import { CreateItemDto } from './items.dto';

describe('CreateItemDto', () => {
  const validPayload = {
    code: ' srv-mtr-2kw ',
    name: 'Servo Motor 2 kW',
    categoryId: '8ac46d21-62eb-4e41-96d6-d2d5e516fdd1',
    uomId: 'df03bd9d-d7a1-44f2-8c61-bb26c466f7c5',
    itemType: ItemType.COMPONENT,
    standardCost: 68000,
    sellingPrice: 82500,
  };

  it('normalizes item codes to uppercase', async () => {
    const dto = plainToInstance(CreateItemDto, validPayload);
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.code).toBe('SRV-MTR-2KW');
  });

  it('rejects negative costs', async () => {
    const dto = plainToInstance(CreateItemDto, { ...validPayload, standardCost: -1 });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'standardCost')).toBe(true);
  });

  it('accepts Zoho-aligned sales, purchase, and product identifiers', async () => {
    const dto = plainToInstance(CreateItemDto, { ...validPayload, manufacturerPartNumber: ' MPN-200 ', barcode: '8901234567890', salesDescription: 'Customer-facing description', purchaseDescription: 'Vendor-facing specification', salesEnabled: true, purchaseEnabled: true });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.manufacturerPartNumber).toBe('MPN-200');
  });
});
