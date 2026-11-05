import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { ProductDto } from '@pf/shared-types';
import { ProductCard } from '../product-card/product-card';

/** The result cards; `null` shows placeholders while the first page loads. */
@Component({
  selector: 'pf-product-list',
  imports: [SkeletonModule, ProductCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList {
  readonly products = input.required<ProductDto[] | null>();
  /** True while a newer page is on its way, so the old one reads as stale, not final. */
  readonly dimmed = input(false);
  protected readonly placeholders = [1, 2, 3, 4];
}
