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
  const value = envelope && typeof envelope === 'object' ? envelope as Partial<ItemPreferences> : {};
  const taxPercent = Number(value.taxPercent ?? DEFAULT_ITEM_PREFERENCES.taxPercent);
  return {
    salesEnabled: typeof value.salesEnabled === 'boolean' ? value.salesEnabled : true,
    purchaseEnabled: typeof value.purchaseEnabled === 'boolean' ? value.purchaseEnabled : true,
    isStockItem: typeof value.isStockItem === 'boolean' ? value.isStockItem : true,
    taxPercent: Number.isFinite(taxPercent) && taxPercent >= 0 && taxPercent <= 100 ? taxPercent : 18,
    requireHsnSac: typeof value.requireHsnSac === 'boolean' ? value.requireHsnSac : false,
  };
}
