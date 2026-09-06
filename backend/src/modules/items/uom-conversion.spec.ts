import { pricePerBaseUom, quantityInBaseUom } from './uom-conversion';

describe('UOM conversion', () => {
  it('converts transaction quantities to the base unit', () => {
    expect(quantityInBaseUom(3, { baseUomId: 'each', conversionFactor: 12 })).toBe(36);
    expect(quantityInBaseUom(500, { baseUomId: 'kilogram', conversionFactor: 0.001 })).toBe(0.5);
  });

  it('normalizes rates to a price per base unit', () => {
    expect(pricePerBaseUom(120, { baseUomId: 'each', conversionFactor: 12 })).toBe(10);
    expect(pricePerBaseUom(40, { baseUomId: 'litre', conversionFactor: 0.5 })).toBe(80);
  });

  it('keeps base-unit quantities and rates unchanged', () => {
    expect(quantityInBaseUom(7, { baseUomId: null, conversionFactor: 99 })).toBe(7);
    expect(pricePerBaseUom(25, { baseUomId: null, conversionFactor: 99 })).toBe(25);
  });
});
