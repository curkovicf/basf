import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { CatalogStatusDto } from '@pf/shared-types';
import { GetCatalogStatusQuery } from '@pf/server-nodejs-api-features-catalog-application';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly queryBus: QueryBus) {}

  /** Lets customers, and monitoring, see how fresh the catalogue is. */
  @Get('status')
  status(): Promise<CatalogStatusDto> {
    return this.queryBus.execute(new GetCatalogStatusQuery());
  }
}
