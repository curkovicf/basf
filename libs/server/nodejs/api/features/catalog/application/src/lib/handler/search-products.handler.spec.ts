import { SearchProductsQuery } from '../query/search-products.query';
import { criteria, noCounts, product, productRepository } from './product-repository.fixture';
import { SearchProductsHandler } from './search-products.handler';

describe('SearchProductsHandler', () => {
  it('maps rows to DTOs, reports the applied sort and echoes paging', async () => {
    const page = await new SearchProductsHandler(productRepository()).execute(
      new SearchProductsQuery(criteria({ q: 'alpha', page: 2 })),
    );

    expect(page.items[0]).toMatchObject({ sku: 'P-1', rating: { average: null, count: 0 } });
    expect(page).toMatchObject({ total: 1, page: 2, pageSize: 20, sort: 'relevance' });
  });

  it('reports a delisted product as discontinued and closed for reviews', async () => {
    const delisted = productRepository({
      search: async () => [product({ status: 'ACTIVE', delistedAt: new Date() })],
    });

    const page = await new SearchProductsHandler(delisted).execute(
      new SearchProductsQuery(criteria()),
    );

    expect(page.items[0]).toMatchObject({ status: 'DISCONTINUED', acceptsReviews: false });
  });

  it('applies the facet rules: global products reach every region, selections stay visible', async () => {
    const counted = productRepository({
      facetCounts: async () => ({
        ...noCounts,
        region: [{ value: 'Global', count: 2 }],
        function: [{ value: 'Solvent', count: 1 }],
      }),
    });

    const { facets } = await new SearchProductsHandler(counted).execute(
      new SearchProductsQuery(criteria({ function: ['Polymer'] })),
    );

    expect(facets.region).toEqual([
      { value: 'EMEA', count: 2 },
      { value: 'Global', count: 2 },
    ]);
    expect(facets.function).toEqual([
      { value: 'Polymer', count: 0 },
      { value: 'Solvent', count: 1 },
    ]);
  });
});
