import { ICatalogStatusRepository } from '@pf/server-nodejs-api-features-catalog-domain';
import { GetCatalogStatusHandler } from './get-catalog-status.handler';

const status = (lastImportAt: Date | null): ICatalogStatusRepository => ({
  lastImportAt: async () => lastImportAt,
});

describe('GetCatalogStatusHandler', () => {
  it('reports the last import as an ISO timestamp', async () => {
    const dto = await new GetCatalogStatusHandler(
      status(new Date('2026-01-01T00:00:00Z')),
    ).execute();

    expect(dto).toEqual({ lastImportAt: '2026-01-01T00:00:00.000Z' });
  });

  it('reports null before the first import', async () => {
    const dto = await new GetCatalogStatusHandler(status(null)).execute();

    expect(dto).toEqual({ lastImportAt: null });
  });
});
