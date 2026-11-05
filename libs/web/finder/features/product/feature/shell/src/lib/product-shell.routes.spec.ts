import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { ProductRoutes } from './product-shell.routes';

describe('ProductRoutes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        providePrimeNG(),
        MessageService,
        provideRouter([{ path: 'products/:sku', loadChildren: () => ProductRoutes }]),
      ],
    });
  });

  it('lazy-loads the product page and hands it the sku from the mount point', async () => {
    const harness = await RouterTestingHarness.create('/products/P-7');
    const http = TestBed.inject(HttpTestingController);

    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('pf-product-page');
    expect(http.match((r) => r.url.includes('/P-7')).length).toBeGreaterThan(0);
    http.match(() => true);
  });
});
