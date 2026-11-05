import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { CatalogStatusDto } from '@pf/shared-types';
import { CatalogDI, ICatalogStatusRepository } from '@pf/server-nodejs-api-features-catalog-domain';
import { GetCatalogStatusQuery } from '../query/get-catalog-status.query';

@QueryHandler(GetCatalogStatusQuery)
export class GetCatalogStatusHandler implements IQueryHandler<
  GetCatalogStatusQuery,
  CatalogStatusDto
> {
  constructor(
    @Inject(CatalogDI.CatalogStatusRepository) private readonly status: ICatalogStatusRepository,
  ) {}

  async execute(): Promise<CatalogStatusDto> {
    const at = await this.status.lastImportAt();

    return { lastImportAt: at?.toISOString() ?? null };
  }
}
