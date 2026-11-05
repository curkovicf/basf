import { NotFoundException } from '@nestjs/common';
import {
  IReviewProductRepository,
  ReviewedProduct,
} from '@pf/server-nodejs-api-features-reviews-domain';

/** Every review use case starts from an existing product; an unknown SKU is a 404. */
export async function requireProduct(
  products: IReviewProductRepository,
  sku: string,
): Promise<ReviewedProduct> {
  const product = await products.findBySku(sku);
  if (!product) throw new NotFoundException(`Product ${sku} not found`);

  return product;
}
