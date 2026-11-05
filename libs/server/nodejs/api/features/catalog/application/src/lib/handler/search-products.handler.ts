import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ProductPageDto } from '@pf/shared-types';
import {
  CatalogDI,
  IProductRepository,
  regionFacet,
  resolveSort,
  withSelected,
} from '@pf/server-nodejs-api-features-catalog-domain';
import { toProductDto } from '../mapper/product.mapper';
import { SearchProductsQuery } from '../query/search-products.query';

@QueryHandler(SearchProductsQuery)
export class SearchProductsHandler implements IQueryHandler<SearchProductsQuery, ProductPageDto> {
  constructor(@Inject(CatalogDI.ProductRepository) private readonly products: IProductRepository) {}

  async execute({ criteria }: SearchProductsQuery): Promise<ProductPageDto> {
    const [items, total, counts, allRegions] = await Promise.all([
      this.products.search(criteria),
      this.products.count(criteria),
      this.products.facetCounts(criteria),
      this.products.regions(),
    ]);

    return {
      items: items.map(toProductDto),
      total,
      page: criteria.page,
      pageSize: criteria.pageSize,
      sort: resolveSort(criteria),
      facets: {
        function: withSelected(counts.function, criteria.function),
        applicationArea: withSelected(counts.applicationArea, criteria.applicationArea),
        region: regionFacet(counts.region, allRegions, criteria.region),
        certification: withSelected(counts.certification, criteria.certification),
        status: withSelected(counts.status, criteria.status),
      },
    };
  }
}
