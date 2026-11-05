import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { providePrimeNG } from 'primeng/config';
import { CatalogRoutes } from './catalog-shell.routes';

describe('CatalogRoutes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        providePrimeNG(),
        provideRouter([{ path: 'products', loadChildren: () => CatalogRoutes }]),
      ],
    });
  });

  it('lazy-loads the search page at the mount point', async () => {
    const harness = await RouterTestingHarness.create('/products?q=alpha');

    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('pf-catalog-page');
    TestBed.inject(HttpTestingController).match(() => true);
  });
});
