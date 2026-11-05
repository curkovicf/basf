/** The PIM's status vocabulary. The API reports a product that left the export as DISCONTINUED. */
export const PRODUCT_STATUSES = ['ACTIVE', 'PHASE_OUT', 'DISCONTINUED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
