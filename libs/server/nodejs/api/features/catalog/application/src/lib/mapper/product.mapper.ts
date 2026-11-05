import type { ProductDto } from '@pf/shared-types';
import {
  Product,
  acceptsReviews,
  effectiveStatus,
  ratingSummary,
} from '@pf/server-nodejs-api-features-catalog-domain';

export function toProductDto(product: Product): ProductDto {
  return {
    sku: product.sku,
    name: product.name,
    chemicalName: product.chemicalName,
    function: product.function,
    applicationArea: product.applicationArea,
    region: product.region,
    certifications: product.certifications,
    status: effectiveStatus(product.status, product.delistedAt),
    launchYear: product.launchYear,
    description: product.description,
    rating: ratingSummary(product.ratingCount, product.ratingAvg),
    acceptsReviews: acceptsReviews(product),
  };
}
