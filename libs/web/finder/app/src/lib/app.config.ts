import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { PRIMEUI_LICENSE } from './primeui-license';

const ProductFinderTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{teal.50}',
      100: '{teal.100}',
      200: '{teal.200}',
      300: '{teal.300}',
      400: '{teal.400}',
      500: '{teal.600}',
      600: '{teal.700}',
      700: '{teal.800}',
      800: '{teal.900}',
      900: '{teal.950}',
      950: '{teal.950}',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    // No zone.js: change detection is driven by signals, so nothing patches browser APIs.
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(
      appRoutes,
      // Back to the results list returns to where the user was reading.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      // Page changes cross-fade instead of cutting; browsers without support just cut.
      withViewTransitions(),
    ),
    providePrimeNG({
      license: PRIMEUI_LICENSE || undefined,
      theme: { preset: ProductFinderTheme, options: { darkModeSelector: false } },
    }),
    MessageService,
  ],
};
