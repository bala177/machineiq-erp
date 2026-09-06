export type UomConversion = {
  baseUomId?: unknown;
  conversionFactor?: number;
};

/**
 * A conversion factor always means: one selected UOM equals this many base
 * units. Example: 1 DOZ = 12 EA, so 3 DOZ becomes 36 EA.
 */
export function quantityInBaseUom(quantity: number, uom: UomConversion): number {
  return Number(quantity || 0) * Number(uom.baseUomId ? uom.conversionFactor : 1);
}

/** Convert a price entered per selected UOM into its price per base unit. */
export function pricePerBaseUom(price: number, uom: UomConversion): number {
  const factor = Number(uom.baseUomId ? uom.conversionFactor : 1);
  return factor > 0 ? Number(price || 0) / factor : 0;
}
