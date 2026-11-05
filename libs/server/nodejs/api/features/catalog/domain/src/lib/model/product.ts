import type { ProductStatus } from '@pf/shared-types';

/** A catalogue product as the domain sees it: PIM data plus the review totals the rating flow maintains. */
export interface Product {
  sku: string;
  name: string;
  chemicalName: string;
  function: string;
  applicationArea: string;
  region: string;
  certifications: string[];
  /** The PIM's status. Use {@link effectiveStatus}: a delisted product is discontinued whatever this says. */
  status: ProductStatus;
  launchYear: number | null;
  description: string;
  /** Set when the product disappeared from an export; cleared if it comes back. */
  delistedAt: Date | null;
  ratingCount: number;
  ratingAvg: number;
}

/** A product that left the export is no longer for sale, whatever its last status said. */
export function effectiveStatus(status: ProductStatus, delistedAt: Date | null): ProductStatus {
  return delistedAt ? 'DISCONTINUED' : status;
}

/** Reviews are closed on discontinued products: a review there could not inform a purchase. */
export function acceptsReviews(product: Pick<Product, 'status' | 'delistedAt'>): boolean {
  return effectiveStatus(product.status, product.delistedAt) !== 'DISCONTINUED';
}
