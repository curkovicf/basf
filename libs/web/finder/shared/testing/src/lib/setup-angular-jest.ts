import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

/** Every Angular library's `test-setup.ts` calls this once. */
export function setupAngularJest(): void {
  setupZonelessTestEnv();

  // Browser APIs that jsdom does not implement but that PrimeNG and the CDK touch.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
  window.scrollTo = () => undefined;
}
