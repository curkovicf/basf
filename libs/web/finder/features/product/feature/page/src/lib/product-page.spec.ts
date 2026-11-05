import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { ProductDto } from '@pf/shared-types';
import { aProduct } from '@pf/web-finder-shared-testing';
import { ReviewForm } from '@pf/web-finder-features-product-ui';
import { ProductPage } from './product-page';

const emptyReviews = { items: [], total: 0, page: 1, pageSize: 10 };

describe('ProductPage', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  const text = () => harness.routeNativeElement!.textContent ?? '';
  const reviewCount = () =>
    harness.routeNativeElement!.querySelector('#reviews-heading .total')?.textContent?.trim();

  async function open(product: ProductDto, reviews: unknown = emptyReviews) {
    harness = await RouterTestingHarness.create(`/products/${product.sku}`);
    http.expectOne(`/api/products/${product.sku}`).flush(product);
    await harness.fixture.whenStable();
    http
      .expectOne((req) => req.url === `/api/products/${product.sku}/reviews`)
      .flush(reviews as object);
    await harness.fixture.whenStable();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        providePrimeNG(),
        MessageService,
        provideRouter([{ path: 'products/:sku', component: ProductPage }]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shows the product and accepts reviews', async () => {
    await open(aProduct({ name: 'Alpha', launchYear: null, certifications: [] }));

    expect(text()).toContain('Alpha');
    expect(text()).toContain('Unknown');
    expect(text()).toContain('None listed');
    expect(text()).toContain('Write a review');
    expect(text()).not.toContain('No longer sold');
  });

  it('warns clearly about a discontinued product and closes reviews', async () => {
    await open(aProduct({ status: 'DISCONTINUED', acceptsReviews: false }));

    expect(text()).toContain('No longer sold');
    expect(text()).toContain('Reviews are closed');
    expect(text()).not.toContain('Write a review');
  });

  it('warns about a product being phased out', async () => {
    await open(aProduct({ status: 'PHASE_OUT' }));
    expect(text()).toContain('Being phased out');
  });

  it('renders markup in a review as plain text', async () => {
    await open(aProduct(), {
      ...emptyReviews,
      total: 1,
      items: [
        {
          id: 1,
          authorName: '<b>Eve</b>',
          rating: 1,
          comment: '<img src=x onerror=alert(1)>',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
    });

    const root = harness.routeNativeElement!;
    expect(root.querySelector('.review-list img')).toBeNull();
    expect(root.querySelector('.review-list b')).toBeNull();
    expect(text()).toContain('<img src=x onerror=alert(1)>');
  });

  it('distinguishes an unknown product from a failure', async () => {
    harness = await RouterTestingHarness.create('/products/NOPE');
    http.expectOne('/api/products/NOPE').flush({}, { status: 404, statusText: 'Not Found' });
    await harness.fixture.whenStable();
    expect(text()).toContain("can't find this product");

    await harness.navigateByUrl('/products/P-2');
    http.expectOne('/api/products/P-2').flush({}, { status: 500, statusText: 'Server Error' });
    await harness.fixture.whenStable();
    expect(text()).toContain("couldn't load this product");
  });

  it('pages through reviews without showing one twice', async () => {
    const review = (id: number) => ({
      id,
      authorName: 'A',
      rating: 5,
      comment: `c${id}`,
      createdAt: '2026-01-01T00:00:00Z',
    });
    await open(aProduct(), { items: [review(2), review(1)], total: 3, page: 1, pageSize: 2 });

    const more = Array.from(harness.routeNativeElement!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Show more'),
    )!;
    more.click();
    await harness.fixture.whenStable();

    const request = http.expectOne((req) => req.url === '/api/products/P-1/reviews');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ items: [review(1), review(0)], total: 3, page: 2, pageSize: 2 });
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement!.querySelectorAll('.review-list li')).toHaveLength(3);
    expect(text()).not.toContain('Show more');
  });

  it('posts a review, then shows it first and updates the rating', async () => {
    await open(aProduct({ rating: { average: null, count: 0 } }));

    const form = harness.fixture.debugElement.query(By.directive(ReviewForm))
      .componentInstance as ReviewForm;
    form.submitted.emit({ rating: 4, authorName: 'Ana', comment: 'Works well at low dose.' });
    await harness.fixture.whenStable();

    const request = http.expectOne('/api/products/P-1/reviews');
    expect(request.request.method).toBe('POST');
    request.flush({
      review: {
        id: 7,
        authorName: 'Ana',
        rating: 4,
        comment: 'Works well at low dose.',
        createdAt: '2026-01-01T00:00:00Z',
      },
      rating: { average: 4, count: 1 },
    });
    await harness.fixture.whenStable();

    expect(reviewCount()).toBe('1');
    expect(text()).toContain('Works well at low dose.');
    expect(text()).toContain('has been published');
  });

  it('explains why a review was not saved and keeps the form open', async () => {
    await open(aProduct());
    const form = harness.fixture.debugElement.query(By.directive(ReviewForm))
      .componentInstance as ReviewForm;
    form.submitted.emit({ rating: 4, authorName: 'Ana', comment: 'Works well at low dose.' });
    await harness.fixture.whenStable();

    http
      .expectOne('/api/products/P-1/reviews')
      .flush({}, { status: 429, statusText: 'Too Many Requests' });
    await harness.fixture.whenStable();

    expect(text()).toContain('wait a minute');
    expect(reviewCount()).toBe('0');
  });
});
