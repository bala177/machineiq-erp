export type ItemPreferences = {
  salesEnabled: boolean;
  purchaseEnabled: boolean;
  isStockItem: boolean;
  taxPercent: number;
  requireHsnSac: boolean;
};

export const DEFAULT_ITEM_PREFERENCES: ItemPreferences = {
  salesEnabled: true,
  purchaseEnabled: true,
  isStockItem: true,
  taxPercent: 18,
  requireHsnSac: false,
};

export function parseItemPreferences(input: unknown): ItemPreferences {
  const envelope = input && typeof input === 'object' && 'value' in input ? (input as { value: unknown }).value : input;
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) throw new Error('Item preferences are unavailable or invalid');
  const value = envelope as Partial<ItemPreferences>;
  if (typeof value.salesEnabled !== 'boolean' || typeof value.purchaseEnabled !== 'boolean'
    || typeof value.isStockItem !== 'boolean' || typeof value.requireHsnSac !== 'boolean') {
    throw new Error('Item preferences are unavailable or invalid');
  }
  const taxPercent = Number(value.taxPercent);
  if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) throw new Error('Item preferences are unavailable or invalid');
  return {
    salesEnabled: value.salesEnabled,
    purchaseEnabled: value.purchaseEnabled,
    isStockItem: value.isStockItem,
    taxPercent,
    requireHsnSac: value.requireHsnSac,
  };
}
