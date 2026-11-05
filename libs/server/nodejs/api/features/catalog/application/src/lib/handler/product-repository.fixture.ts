import {
  IProductRepository,
  Product,
  ProductFacetCounts,
  ProductSearchCriteria,
} from '@pf/server-nodejs-api-features-catalog-domain';

/** In-memory stand-ins for the catalog ports, shared by the handler specs. */

export const product = (overrides: Partial<Product> = {}): Product => ({
  sku: 'P-1',
  name: 'Alpha',
  chemicalName: 'Lecithin',
  function: 'Emulsifier',
  applicationArea: 'Personal Care',
  region: 'EMEA',
  certifications: ['Vegan'],
  status: 'ACTIVE',
  launchYear: 2020,
  description: 'An emulsifier.',
  delistedAt: null,
  ratingCount: 0,
  ratingAvg: 0,
  ...overrides,
});

export const noCounts: ProductFacetCounts = {
  function: [],
  applicationArea: [],
  region: [],
  certification: [],
  status: [],
};

export const productRepository = (
  overrides: Partial<IProductRepository> = {},
): IProductRepository => ({
  search: async () => [product()],
  count: async () => 1,
  facetCounts: async () => noCounts,
  regions: async () => ['EMEA', 'Global'],
  findBySku: async () => null,
  ...overrides,
});

export const criteria = (values: Partial<ProductSearchCriteria> = {}): ProductSearchCriteria => ({
  page: 1,
  pageSize: 20,
  ...values,
});
