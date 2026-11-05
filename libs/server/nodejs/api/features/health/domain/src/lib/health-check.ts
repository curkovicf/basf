/** One dependency the service cannot work without. `check` resolves while it answers and rejects otherwise. */
export interface HealthCheck {
  readonly name: string;
  check(): Promise<void>;
}

export interface HealthReport {
  status: 'ok' | 'down';
  /** `ok`, or the reason the dependency failed. */
  checks: Record<string, string>;
}

export class HealthDI {
  /** `HealthCheck[]`: every dependency the probe must see answering. */
  public static readonly HealthChecks: unique symbol = Symbol('HealthChecks');
}

export async function runHealthChecks(checks: HealthCheck[]): Promise<HealthReport> {
  const results = await Promise.all(
    checks.map(async (check) => {
      try {
        await check.check();
        return [check.name, 'ok'] as const;
      } catch (error) {
        return [check.name, error instanceof Error ? error.message : String(error)] as const;
      }
    }),
  );
  const down = results.some(([, result]) => result !== 'ok');
  return { status: down ? 'down' : 'ok', checks: Object.fromEntries(results) };
}
