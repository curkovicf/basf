import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { PrismaService } from '@pf/server-nodejs-api-shared-infrastructure';
import { createTestApp, csv, importer, resetDatabase } from './support/helpers';

describe('HTTP API', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  const skus = (body: { items: { sku: string }[] }) => body.items.map((item) => item.sku);
  const validReview = { authorName: 'Ana K.', rating: 5, comment: 'Stable emulsions at low dose.' };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
    await importer(prisma).import(
      csv(
        {
          sku: 'P-1',
          name: 'Alpha',
          chemical: 'Lecithin',
          fn: 'Emulsifier',
          region: 'EMEA',
          certs: 'Vegan|Halal',
          year: '2010',
        },
        {
          sku: 'P-2',
          name: 'Beta',
          chemical: 'Glycerin',
          fn: 'Solvent',
          region: 'Global',
          certs: 'Vegan',
          year: '2020',
        },
        {
          sku: 'P-3',
          name: 'Gamma',
          chemical: 'Bentonite',
          fn: 'Polymer',
          region: 'North America',
          status: 'Phase-out',
          year: 'n/a',
        },
        {
          sku: 'P-4',
          name: 'Delta',
          chemical: 'Lecithin',
          fn: 'Emulsifier',
          region: 'EMEA',
          status: 'Discontinued',
          year: '2015',
        },
        {
          sku: 'P-5',
          name: 'Lecithin Pure',
          chemical: 'Squalane',
          fn: 'Emollient',
          region: 'Latin America',
          description: '100% natural',
        },
      ),
      { source: 'test' },
    );
  });
  afterAll(() => app.close());

  describe('GET /api/products', () => {
    it('hides discontinued products unless they are asked for', async () => {
      const { body } = await http().get('/api/products').expect(200);
      expect(skus(body)).toEqual(['P-1', 'P-2', 'P-3', 'P-5']);

      const facet = Object.fromEntries(
        body.facets.status.map((f: { value: string; count: number }) => [f.value, f.count]),
      );
      expect(facet).toEqual({ ACTIVE: 3, PHASE_OUT: 1, DISCONTINUED: 1 });

      const discontinued = await http().get('/api/products?status=DISCONTINUED').expect(200);
      expect(skus(discontinued.body)).toEqual(['P-4']);
    });

    it('treats a product that left the export as discontinued', async () => {
      await prisma.product.update({ where: { sku: 'P-2' }, data: { delistedAt: new Date() } });

      const list = await http().get('/api/products').expect(200);
      expect(skus(list.body)).not.toContain('P-2');

      const detail = await http().get('/api/products/P-2').expect(200);
      expect(detail.body).toMatchObject({ status: 'DISCONTINUED', acceptsReviews: false });
    });

    it('searches across fields, requires every word, and is case-insensitive', async () => {
      const chemical = await http().get('/api/products?q=LECITHIN').expect(200);
      expect(skus(chemical.body)).toEqual(expect.arrayContaining(['P-1', 'P-5']));

      const bothWords = await http().get('/api/products?q=lecithin%20emea').expect(200);
      expect(skus(bothWords.body)).toEqual(['P-1']);
    });

    it('ranks a product name match above a match elsewhere', async () => {
      const { body } = await http().get('/api/products?q=lecithin').expect(200);
      expect(body.sort).toBe('relevance');
      expect(skus(body)).toEqual(['P-5', 'P-1']);
    });

    it('treats LIKE wildcards and SQL in the search as plain text', async () => {
      const percent = await http().get('/api/products').query({ q: '%' }).expect(200);
      expect(skus(percent.body)).toEqual(['P-5']); // only P-5 literally contains "%"

      const underscore = await http().get('/api/products').query({ q: '_' }).expect(200);
      expect(underscore.body.total).toBe(0);

      const injection = await http()
        .get('/api/products')
        .query({ q: "'; DROP TABLE products; --" })
        .expect(200);
      expect(injection.body.total).toBe(0);
      expect(await prisma.product.count()).toBe(5);
    });

    it('includes global products when filtering by a region', async () => {
      const emea = await http().get('/api/products?region=EMEA').expect(200);
      expect(skus(emea.body)).toEqual(['P-1', 'P-2']);

      const global = await http().get('/api/products?region=Global').expect(200);
      expect(skus(global.body)).toEqual(['P-2']);
    });

    it('promises in region counts exactly what the region filter returns', async () => {
      const all = await http().get('/api/products').expect(200);
      const emeaFacet = all.body.facets.region.find((f: { value: string }) => f.value === 'EMEA');
      const emea = await http().get('/api/products?region=EMEA').expect(200);
      expect(emeaFacet.count).toBe(emea.body.total);
    });

    it('offers a region whose only matches are global products', async () => {
      const { body } = await http().get('/api/products?q=glycerin').expect(200);
      expect(skus(body)).toEqual(['P-2']); // A Global product; nothing matches in EMEA itself.
      expect(body.facets.region).toContainEqual({ value: 'EMEA', count: 1 });

      const filtered = await http().get('/api/products?q=glycerin&region=EMEA').expect(200);
      expect(filtered.body.total).toBe(1);
    });

    it('ORs within a filter group and ANDs certifications', async () => {
      const either = await http()
        .get('/api/products?function=Solvent&function=Polymer')
        .expect(200);
      expect(skus(either.body)).toEqual(['P-2', 'P-3']);

      const vegan = await http().get('/api/products?certification=Vegan').expect(200);
      expect(skus(vegan.body)).toEqual(['P-1', 'P-2']);

      const both = await http()
        .get('/api/products?certification=Vegan&certification=Halal')
        .expect(200);
      expect(skus(both.body)).toEqual(['P-1']);
    });

    it('keeps other options of a group visible in its facet, and selected ones at zero', async () => {
      const { body } = await http()
        .get('/api/products?function=Solvent&applicationArea=Nothing')
        .expect(200);
      const values = body.facets.function.map((f: { value: string }) => f.value);
      expect(body.total).toBe(0);
      expect(body.facets.applicationArea).toContainEqual({ value: 'Nothing', count: 0 });
      expect(values).toContain('Solvent');
    });

    it('sorts with unknown years last and paginates without overlap', async () => {
      const newest = await http().get('/api/products?sort=newest').expect(200);
      expect(skus(newest.body).at(-1)).toBe('P-3');

      const oldest = await http().get('/api/products?sort=oldest').expect(200);
      expect(skus(oldest.body).at(0)).toBe('P-1');
      expect(skus(oldest.body).at(-1)).toBe('P-3');

      const first = await http().get('/api/products?pageSize=2&page=1').expect(200);
      const second = await http().get('/api/products?pageSize=2&page=2').expect(200);
      expect(first.body.total).toBe(4);
      expect([...skus(first.body), ...skus(second.body)]).toEqual(['P-1', 'P-2', 'P-3', 'P-5']);
    });

    it.each(['sort=bogus', 'page=0', 'pageSize=1000', 'status=DELETED', 'unknown=1'])(
      'rejects %s',
      async (qs) => {
        await http().get(`/api/products?${qs}`).expect(400);
      },
    );
  });

  describe('GET /api/products/:sku', () => {
    it('finds a product regardless of SKU case, so hand-typed links work', async () => {
      const { body } = await http().get('/api/products/p-1').expect(200);
      expect(body).toMatchObject({
        sku: 'P-1',
        name: 'Alpha',
        rating: { average: null, count: 0 },
      });
    });

    it('returns 404 for an unknown SKU', async () => {
      await http().get('/api/products/NOPE').expect(404);
    });

    it('still serves a discontinued product, because old links exist', async () => {
      const { body } = await http().get('/api/products/P-4').expect(200);
      expect(body).toMatchObject({ status: 'DISCONTINUED', acceptsReviews: false });
    });
  });

  describe('reviews', () => {
    it('stores a review, lists it, and updates the rating', async () => {
      const created = await http().post('/api/products/P-1/reviews').send(validReview).expect(201);
      expect(created.body.rating).toEqual({ average: 5, count: 1 });

      await http()
        .post('/api/products/P-1/reviews')
        .send({ ...validReview, rating: 2 })
        .expect(201);

      const { body } = await http().get('/api/products/P-1/reviews').expect(200);
      expect(body.total).toBe(2);
      expect(body.items[0]).toMatchObject({ authorName: 'Ana K.', rating: 2 });

      const product = await http().get('/api/products/P-1').expect(200);
      expect(product.body.rating).toEqual({ average: 3.5, count: 2 });
    });

    it('loses no rating updates under concurrent submissions', async () => {
      const ratings = Array.from({ length: 25 }, (_, i) => (i % 5) + 1);
      await Promise.all(
        ratings.map((rating) =>
          http()
            .post('/api/products/P-1/reviews')
            .send({ ...validReview, rating })
            .expect(201),
        ),
      );

      const product = await prisma.product.findUniqueOrThrow({ where: { sku: 'P-1' } });
      expect(product).toMatchObject({ ratingCount: 25, ratingSum: 75, ratingAvg: 3 });
    });

    it('makes rated products sort above unrated ones', async () => {
      await http()
        .post('/api/products/P-3/reviews')
        .send({ ...validReview, rating: 1 })
        .expect(201);
      await http()
        .post('/api/products/P-5/reviews')
        .send({ ...validReview, rating: 4 })
        .expect(201);

      const { body } = await http().get('/api/products?sort=rating').expect(200);
      expect(skus(body).slice(0, 2)).toEqual(['P-5', 'P-3']);
    });

    it.each([
      ['rating too high', { ...validReview, rating: 6 }],
      ['rating too low', { ...validReview, rating: 0 }],
      ['fractional rating', { ...validReview, rating: 4.5 }],
      ['rating as string', { ...validReview, rating: '5' }],
      ['whitespace-only comment', { ...validReview, comment: '             ' }],
      ['oversized comment', { ...validReview, comment: 'x'.repeat(2001) }],
      ['missing author', { rating: 5, comment: validReview.comment }],
      ['client-supplied extra field', { ...validReview, createdAt: '2000-01-01' }],
    ])('rejects %s', async (_label, payload) => {
      await http().post('/api/products/P-1/reviews').send(payload).expect(400);
      expect(await prisma.review.count()).toBe(0);
    });

    it('returns 404 for an unknown product', async () => {
      await http().post('/api/products/NOPE/reviews').send(validReview).expect(404);
    });

    it('closes reviews on discontinued products', async () => {
      await http().post('/api/products/P-4/reviews').send(validReview).expect(409);
    });

    it("returns markup verbatim as data; escaping is the renderer's job", async () => {
      const comment = '<script>alert("xss")</script> nice product';
      await http()
        .post('/api/products/P-1/reviews')
        .send({ ...validReview, comment })
        .expect(201);

      const response = await http().get('/api/products/P-1/reviews').expect(200);
      expect(response.body.items[0].comment).toBe(comment);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('re-importing the catalogue keeps reviews visible with correct totals', async () => {
      await http().post('/api/products/P-1/reviews').send(validReview).expect(201);

      await importer(prisma).import(
        csv(
          { sku: 'P-1', name: 'Alpha renamed' },
          { sku: 'P-2' },
          { sku: 'P-3' },
          { sku: 'P-4' },
          { sku: 'P-5' },
        ),
        { source: 'test' },
      );

      const product = await http().get('/api/products/P-1').expect(200);
      expect(product.body).toMatchObject({
        name: 'Alpha renamed',
        rating: { average: 5, count: 1 },
      });
      const reviews = await http().get('/api/products/P-1/reviews').expect(200);
      expect(reviews.body.total).toBe(1);
    });
  });

  it('reports catalogue freshness and health', async () => {
    const status = await http().get('/api/catalog/status').expect(200);
    expect(Date.parse(status.body.lastImportAt)).not.toBeNaN();
    await http().get('/api/health').expect(200);
  });
});
