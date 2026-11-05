export * from './lib/api-shared-infrastructure.module';
export * from './lib/config/environment.constant';
export * from './lib/config/environment.validation';
export * from './lib/prisma/create-prisma-client';
export * from './lib/prisma/prisma.module';
export * from './lib/prisma/prisma.service';

// The generated client, so feature infrastructure never reaches into this lib's folders.
export { Prisma, PrismaClient } from './lib/prisma/generated/client';
