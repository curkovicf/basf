import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { PrismaService } from '@pf/server-nodejs-api-shared-infrastructure';
import { createTestApp, csv, importer, resetDatabase } from './support/helpers';

const review = { authorName: 'Ana K.', rating: 5, comment: 'Stable emulsions at low dose.' };

describe('review rate limit behind a proxy', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    process.env.REVIEW_RATE_LIMIT = '2';
    process.env.TRUST_PROXY = '1';
    app = await createTestApp();
    const prisma = app.get(PrismaService);
    await resetDatabase(prisma);
    await importer(prisma).import(csv({ sku: 'P-1' }), { source: 'test' });
  });
  afterAll(() => app.close());

  const post = (ip: string) =>
    request(app.getHttpServer())
      .post('/api/products/P-1/reviews')
      .set('X-Forwarded-For', ip)
      .send(review);

  it('throttles one client without affecting the others, and never throttles reads', async () => {
    await post('203.0.113.1').expect(201);
    await post('203.0.113.1').expect(201);
    await post('203.0.113.1').expect(429);

    await post('203.0.113.2').expect(201);

    await request(app.getHttpServer())
      .get('/api/products')
      .set('X-Forwarded-For', '203.0.113.1')
      .expect(200);
  });
});
