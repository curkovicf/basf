import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { map } from 'rxjs';
import { CreateReviewRequest, ReviewDto } from '@pf/shared-types';
import { ProductApi } from '@pf/web-finder-shared-data-access';
import { RatingBadge } from '@pf/web-finder-shared-ui';
import {
  AvailabilityNotice,
  ProductDetails,
  ProductHeader,
  ReviewForm,
  ReviewList,
  ReviewSubmitStatus,
} from '@pf/web-finder-features-product-ui';
import { reviewErrorMessage } from './review-error-message';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

/**
 * The smart side of the product page: routing, data and the title. Everything visible is
 * composed from the dumb blocks in `features/product/ui`.
 */
@Component({
  selector: 'pf-product-page',
  imports: [
    RouterLink,
    ButtonDirective,
    MessageModule,
    SkeletonModule,
    AvailabilityNotice,
    ProductDetails,
    ProductHeader,
    RatingBadge,
    ReviewForm,
    ReviewList,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss',
})
export class ProductPage {
  private readonly api = inject(ProductApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly title = inject(Title);
  private readonly messages = inject(MessageService);

  private readonly sku = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('sku') ?? '')),
    {
      initialValue: '',
    },
  );

  /** Reloads, and cancels the request in flight, whenever the SKU in the URL changes. */
  private readonly productResource = rxResource({
    params: this.sku,
    stream: ({ params }) => this.api.product(params),
  });

  protected readonly product = computed(() =>
    this.productResource.hasValue() ? this.productResource.value() : null,
  );

  protected readonly state = computed<LoadState>(() => {
    switch (this.productResource.status()) {
      case 'resolved':
      case 'local':
      case 'reloading':
        return 'ready';
      case 'error': {
        const error = this.productResource.error();
        return error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error';
      }
      default:
        return 'loading';
    }
  });

  protected readonly reviews = signal<ReviewDto[]>([]);
  protected readonly reviewTotal = signal(0);
  protected readonly reviewsFailed = signal(false);
  protected readonly loadingMoreReviews = signal(false);
  private reviewPage = 1;
  protected readonly hasMoreReviews = computed(() => this.reviews().length < this.reviewTotal());

  protected readonly reviewSubmit = signal<ReviewSubmitStatus>('idle');
  protected readonly reviewError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const product = this.product();
      if (product) this.title.setTitle(`${product.name} | Product Finder`);
    });

    // Reviews belong to one SKU: start over when it changes. Keyed on the SKU, not the product,
    // because posting a review updates the product's rating and must not reload the list.
    const loadedSku = computed(() => this.product()?.sku);
    effect(() => {
      if (!loadedSku()) return;
      untracked(() => {
        this.resetReviews();
        this.loadReviews();
      });
    });
  }

  /** Back to the exact search the user came from; a shared link has none to go back to. */
  protected back(): void {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      this.location.back();
    } else {
      void this.router.navigate(['/products']);
    }
  }

  protected async share(): Promise<void> {
    const url = window.location.href;
    const name = this.product()?.name ?? 'Product';
    if (navigator.share) {
      // On phones the native share sheet reaches chat apps directly.
      await navigator.share({ title: name, url }).catch(() => undefined);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      this.messages.add({ severity: 'success', summary: 'Link copied', life: 2500 });
    } catch {
      this.messages.add({ severity: 'info', summary: 'Copy this link', detail: url, sticky: true });
    }
  }

  protected loadReviews(): void {
    const sku = this.sku();
    this.loadingMoreReviews.set(true);
    this.reviewsFailed.set(false);
    this.api.reviews(sku, this.reviewPage).subscribe({
      next: (page) => {
        // A page for the product the user has already left must not land in the next one.
        if (sku !== this.sku()) return;
        // A review posted meanwhile shifts later pages, so de-duplicate by id.
        const known = new Set(this.reviews().map((review) => review.id));
        this.reviews.update((current) => [
          ...current,
          ...page.items.filter((review) => !known.has(review.id)),
        ]);
        this.reviewTotal.set(page.total);
        this.reviewPage += 1;
        this.loadingMoreReviews.set(false);
      },
      error: () => {
        this.reviewsFailed.set(true);
        this.loadingMoreReviews.set(false);
      },
    });
  }

  protected submitReview(review: CreateReviewRequest): void {
    if (this.reviewSubmit() === 'submitting') return;
    this.reviewSubmit.set('submitting');
    this.reviewError.set(null);
    this.api.createReview(this.sku(), review).subscribe({
      next: ({ review: created, rating }) => {
        this.reviews.update((current) => [created, ...current]);
        this.reviewTotal.update((total) => total + 1);
        this.productResource.value.update((product) =>
          product ? { ...product, rating } : product,
        );
        this.reviewSubmit.set('success');
      },
      error: (error: unknown) => {
        this.reviewError.set(reviewErrorMessage(error));
        this.reviewSubmit.set('error');
      },
    });
  }

  private resetReviews(): void {
    this.reviews.set([]);
    this.reviewTotal.set(0);
    this.reviewPage = 1;
    this.reviewSubmit.set('idle');
    this.reviewError.set(null);
  }
}
