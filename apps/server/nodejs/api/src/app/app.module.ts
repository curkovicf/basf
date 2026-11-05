import { Module } from '@nestjs/common';
import { ServerShellModule } from '@pf/server-nodejs-api-shell';

@Module({
  imports: [ServerShellModule],
})
export class AppModule {}
