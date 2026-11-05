import { HealthCheck, runHealthChecks } from './health-check';

const check = (name: string, error?: string): HealthCheck => ({
  name,
  check: async () => {
    if (error) throw new Error(error);
  },
});

describe('runHealthChecks', () => {
  it('reports ok while every dependency answers', async () => {
    expect(await runHealthChecks([check('postgres')])).toEqual({
      status: 'ok',
      checks: { postgres: 'ok' },
    });
  });

  it('names the failing dependency and its reason', async () => {
    expect(await runHealthChecks([check('postgres', 'ECONNREFUSED')])).toEqual({
      status: 'down',
      checks: { postgres: 'ECONNREFUSED' },
    });
  });
});
