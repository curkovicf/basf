import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { providePrimeNG } from 'primeng/config';
import { aPage, aProduct } from '@pf/web-finder-shared-testing';
import { CatalogPage } from './catalog-page';

describe('CatalogPage', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  let router: Router;

  const pending = () => http.expectOne((req) => req.url === '/api/products');
  const text = () => harness.routeNativeElement!.textContent ?? '';

  async function open(url: string, page = aPage()) {
    harness = await RouterTestingHarness.create(url);
    const request = pending();
    request.flush(page);
    await harness.fixture.whenStable();
    return request;
  }

  /**
   * Lets navigation, effects and the resource run. Not `whenStable()`: a resource keeps the app
   * unstable while its request is pending, so that would wait for a flush that comes after it.
   */
  async function settle() {
    for (let round = 0; round < 3; round++) {
      await new Promise((resolve) => setTimeout(resolve));
      TestBed.tick();
    }
    harness.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        providePrimeNG(),
        provideRouter([
          { path: 'products', component: CatalogPage },
          { path: 'products/:sku', component: CatalogPage },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  it('restores a shared link: the URL alone determines the request', async () => {
    const { request } = await open(
      '/products?q=lecithin&region=EMEA&function=Solvent&function=Polymer&sort=rating&page=2',
    );

    expect(request.params.get('q')).toBe('lecithin');
    expect(request.params.getAll('region')).toEqual(['EMEA']);
    expect(request.params.getAll('function')).toEqual(['Solvent', 'Polymer']);
    expect(request.params.get('sort')).toBe('rating');
    expect(request.params.get('page')).toBe('2');
  });

  it('shows the results and their count', async () => {
    await open('/products', aPage({ items: [aProduct({ name: 'Alpha' })], total: 1 }));

    expect(text()).toContain('Alpha');
    expect(text()).toContain('1 product');
  });

  it('puts a selected filter into the URL and returns to page 1', async () => {
    await open('/products?page=3');

    const checkbox =
      harness.routeNativeElement!.querySelector<HTMLInputElement>('input[id="region-EMEA"]');
    checkbox!.click();
    await settle();

    expect(router.url).toBe('/products?region=EMEA');
    expect(pending().request.params.getAll('region')).toEqual(['EMEA']);
  });

  it('debounces typing, and updates the URL only when the user pauses', async () => {
    await open('/products');
    const input =
      harness.routeNativeElement!.querySelector<HTMLInputElement>('input[type="search"]')!;

    for (const value of ['l', 'le', 'lec']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    http.expectNone((req) => req.url === '/api/products');
    expect(router.url).toBe('/products');

    await new Promise((resolve) => setTimeout(resolve, 350));
    await settle();

    expect(router.url).toBe('/products?q=lec');
    pending().flush(aPage());
  });

  it('ignores a slow response that a newer search has replaced', async () => {
    harness = await RouterTestingHarness.create('/products?q=old');
    const stale = pending();

    await router.navigateByUrl('/products?q=new');
    await settle();

    expect(stale.cancelled).toBe(true);
    pending().flush(aPage({ items: [aProduct({ name: 'Fresh result' })] }));
    await settle();
    expect(text()).toContain('Fresh result');
  });

  it('tells the user about matching discontinued products and can show them', async () => {
    const facets = { ...aPage().facets, status: [{ value: 'DISCONTINUED', count: 2 }] };
    await open('/products?q=old-name', aPage({ items: [], total: 0, facets }));

    expect(text()).toContain('2 discontinued products also match');

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('button.link')!.click();
    await settle();

    expect(router.url).toBe('/products?q=old-name&status=DISCONTINUED');
    pending().flush(aPage());
  });

  it('does not mention discontinued products on the unfiltered landing page', async () => {
    const facets = { ...aPage().facets, status: [{ value: 'DISCONTINUED', count: 30 }] };
    await open('/products', aPage({ facets }));

    expect(text()).not.toContain('also match');
  });

  it('shows an empty state with a way out', async () => {
    await open('/products?region=EMEA', aPage({ items: [], total: 0 }));

    expect(text()).toContain('No products match');
    expect(text()).toContain('Clear filters');
  });

  it('shows an error, and retries the same search', async () => {
    harness = await RouterTestingHarness.create('/products?q=x');
    pending().flush('boom', { status: 500, statusText: 'Server Error' });
    await settle();

    expect(text()).toContain("couldn't load products");

    const retry = Array.from(harness.routeNativeElement!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Retry'),
    )!;
    retry.click();
    await settle();

    const again = pending();
    expect(again.request.params.get('q')).toBe('x');
    again.flush(aPage());
    await settle();
    expect(text()).not.toContain("couldn't load products");
  });
});
