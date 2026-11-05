import type { Product } from '@pf/server-nodejs-api-features-catalog-domain';
import type { ProductStatus } from '@pf/shared-types';

/** A `products` row as `PRODUCT_COLUMNS` selects it. */
export interface ProductRow {
  sku: string;
  name: string;
  chemical_name: string;
  function: string;
  application_area: string;
  region: string;
  certifications: string[];
  status: string;
  launch_year: number | null;
  description: string;
  delisted_at: Date | null;
  rating_count: number;
  rating_avg: number;
}

export function toProduct(row: ProductRow): Product {
  return {
    sku: row.sku,
    name: row.name,
    chemicalName: row.chemical_name,
    function: row.function,
    applicationArea: row.application_area,
    region: row.region,
    certifications: row.certifications,
    status: row.status as ProductStatus,
    launchYear: row.launch_year,
    description: row.description,
    delistedAt: row.delisted_at,
    ratingCount: row.rating_count,
    ratingAvg: row.rating_avg,
  };
}
