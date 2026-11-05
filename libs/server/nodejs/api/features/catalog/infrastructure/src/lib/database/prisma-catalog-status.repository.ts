import { Injectable } from '@nestjs/common';
import { PrismaService } from '@pf/server-nodejs-api-shared-infrastructure';
import type { ICatalogStatusRepository } from '@pf/server-nodejs-api-features-catalog-domain';

@Injectable()
export class PrismaCatalogStatusRepository implements ICatalogStatusRepository {
  constructor(private readonly prisma: PrismaService) {}

  async lastImportAt(): Promise<Date | null> {
    const run = await this.prisma.importRun.findFirst({
      where: { status: 'SUCCEEDED' },
      orderBy: { finishedAt: 'desc' },
      select: { finishedAt: true },
    });
    return run?.finishedAt ?? null;
  }
}
