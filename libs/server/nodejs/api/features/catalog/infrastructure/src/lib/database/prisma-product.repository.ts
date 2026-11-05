import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@pf/server-nodejs-api-shared-infrastructure';
import {
  FacetValue,
  FilterGroup,
  IProductRepository,
  Product,
  ProductFacetCounts,
  ProductSearchCriteria,
} from '@pf/server-nodejs-api-features-catalog-domain';
import { ProductRow, toProduct } from './product-row';
import { EFFECTIVE_STATUS_SQL, PRODUCT_COLUMNS, buildOrderBy, buildWhere } from './product-sql';

/**
 * Raw SQL through Prisma: trigram search, array facets and relevance ranking don't fit
 * the query API. Everything is parameterised through `Prisma.sql`.
 */
@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(criteria: ProductSearchCriteria): Promise<Product[]> {
    const rows = await this.prisma.$queryRaw<ProductRow[]>`
      SELECT ${PRODUCT_COLUMNS} FROM products
      ${buildWhere(criteria)}
      ${buildOrderBy(criteria)}
      LIMIT ${criteria.pageSize} OFFSET ${(criteria.page - 1) * criteria.pageSize}`;
    return rows.map(toProduct);
  }

  async count(criteria: ProductSearchCriteria): Promise<number> {
    const [{ count }] = await this.prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count FROM products ${buildWhere(criteria)}`;
    return count;
  }

  async facetCounts(criteria: ProductSearchCriteria): Promise<ProductFacetCounts> {
    const [fn, applicationArea, region, certification, status] = await Promise.all([
      this.columnFacet(Prisma.sql`function`, criteria, 'function'),
      this.columnFacet(Prisma.sql`application_area`, criteria, 'applicationArea'),
      this.columnFacet(Prisma.sql`region`, criteria, 'region'),
      // Not omitted: certifications narrow (AND), so counts reflect the current selection.
      this.columnFacet(Prisma.sql`unnest(certifications)`, criteria),
      this.columnFacet(EFFECTIVE_STATUS_SQL, criteria, 'status'),
    ]);
    return { function: fn, applicationArea, region, certification, status };
  }

  async regions(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ region: string }[]>`
      SELECT DISTINCT region FROM products`;
    return rows.map((row) => row.region);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const [row] = await this.prisma.$queryRaw<ProductRow[]>`
      SELECT ${PRODUCT_COLUMNS} FROM products WHERE sku = ${sku.toUpperCase()}`;
    return row ? toProduct(row) : null;
  }

  private columnFacet(
    expression: Prisma.Sql,
    criteria: ProductSearchCriteria,
    omit?: FilterGroup,
  ): Promise<FacetValue[]> {
    return this.prisma.$queryRaw<FacetValue[]>`
      SELECT ${expression} AS value, count(*)::int AS count
      FROM products ${buildWhere(criteria, omit)}
      GROUP BY 1`;
  }
}
