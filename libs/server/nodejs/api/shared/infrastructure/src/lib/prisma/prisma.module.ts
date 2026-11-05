import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService, PrismaShutdown, prismaProvider } from './prisma.service';

/** Global so that every feature's infrastructure resolves the one client without importing this module. */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [prismaProvider, PrismaShutdown],
  exports: [PrismaService],
})
export class PrismaModule {}
