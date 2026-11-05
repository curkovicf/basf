import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ProductDto } from '@pf/shared-types';
import { CatalogDI, IProductRepository } from '@pf/server-nodejs-api-features-catalog-domain';
import { toProductDto } from '../mapper/product.mapper';
import { GetProductQuery } from '../query/get-product.query';

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery, ProductDto> {
  constructor(@Inject(CatalogDI.ProductRepository) private readonly products: IProductRepository) {}

  async execute({ sku }: GetProductQuery): Promise<ProductDto> {
    const product = await this.products.findBySku(sku);
    if (!product) throw new NotFoundException(`Product ${sku} not found`);

    return toProductDto(product);
  }
}
