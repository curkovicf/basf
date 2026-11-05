import { NotFoundException } from '@nestjs/common';
import { GetProductQuery } from '../query/get-product.query';
import { GetProductHandler } from './get-product.handler';
import { product, productRepository } from './product-repository.fixture';

describe('GetProductHandler', () => {
  it('answers 404 for an unknown SKU', async () => {
    await expect(
      new GetProductHandler(productRepository()).execute(new GetProductQuery('NOPE')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rounds the rating to one decimal', async () => {
    const rated = productRepository({
      findBySku: async () => product({ ratingCount: 3, ratingAvg: 3.6666 }),
    });

    const dto = await new GetProductHandler(rated).execute(new GetProductQuery('P-1'));

    expect(dto.rating).toEqual({ average: 3.7, count: 3 });
  });
});
