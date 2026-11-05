import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../config/environment.constant';
import { createPrismaClient } from './create-prisma-client';
import { PrismaClient } from './generated/client';

/** Injection token for the shared client; the class doubles as its TypeScript type. */
@Injectable()
export abstract class PrismaService extends PrismaClient {}

export const prismaProvider = {
  provide: PrismaService,
  inject: [ConfigService],
  useFactory: (config: ConfigService): PrismaClient =>
    createPrismaClient(config.get<string>(EnvironmentVariables.DATABASE_URL)),
};

@Injectable()
export class PrismaShutdown implements OnModuleDestroy {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
