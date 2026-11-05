import type { ProductStatus } from '@pf/shared-types';

/** What the review flow needs to know about a product: that it exists, and whether it is still sold. */
export interface ReviewedProduct {
  id: number;
  sku: string;
  status: ProductStatus;
  delistedAt: Date | null;
}

export interface IReviewProductRepository {
  /** Case-insensitive on the SKU. Delisted products are found too: their reviews stay readable. */
  findBySku(sku: string): Promise<ReviewedProduct | null>;
}
