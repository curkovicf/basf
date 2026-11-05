import { ProductDto, ProductPageDto } from '@pf/shared-types';

export function aProduct(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
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
    rating: { average: null, count: 0 },
    acceptsReviews: true,
    ...overrides,
  };
}

export function aPage(overrides: Partial<ProductPageDto> = {}): ProductPageDto {
  return {
    items: [aProduct()],
    total: 1,
    page: 1,
    pageSize: 20,
    sort: 'name',
    facets: {
      function: [{ value: 'Emulsifier', count: 1 }],
      applicationArea: [],
      region: [{ value: 'EMEA', count: 1 }],
      certification: [],
      status: [{ value: 'ACTIVE', count: 1 }],
    },
    ...overrides,
  };
}
