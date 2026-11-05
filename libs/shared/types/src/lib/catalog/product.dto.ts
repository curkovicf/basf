import type { ProductStatus } from './product-status';

export interface RatingSummaryDto {
  /** Null, not 0, when there are no reviews: "unrated" is not "rated badly". */
  average: number | null;
  count: number;
}

export interface ProductDto {
  sku: string;
  name: string;
  chemicalName: string;
  function: string;
  applicationArea: string;
  region: string;
  certifications: string[];
  status: ProductStatus;
  launchYear: number | null;
  description: string;
  rating: RatingSummaryDto;
  /** False for discontinued products: a review there could not inform a purchase. */
  acceptsReviews: boolean;
}
