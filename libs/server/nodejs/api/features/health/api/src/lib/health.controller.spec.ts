import { ServiceUnavailableException } from '@nestjs/common';
import { HealthCheck } from '@pf/server-nodejs-api-features-health-domain';
import { HealthController } from './health.controller';

const check = (name: string, error?: string): HealthCheck => ({
  name,
  check: async () => {
    if (error) throw new Error(error);
  },
});

describe('HealthController', () => {
  it('reports ok while every dependency answers', async () => {
    const report = await new HealthController([check('postgres')]).check();
    expect(report).toEqual({ status: 'ok', checks: { postgres: 'ok' } });
  });

  it('answers 503 with the reason when a dependency is down', async () => {
    const controller = new HealthController([check('postgres', 'ECONNREFUSED')]);

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
    await controller.check().catch((error: ServiceUnavailableException) => {
      expect(error.getResponse()).toMatchObject({
        status: 'down',
        checks: { postgres: 'ECONNREFUSED' },
      });
    });
  });
});
