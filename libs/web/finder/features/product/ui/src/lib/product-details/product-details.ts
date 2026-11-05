import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProductDto } from '@pf/shared-types';

/** The specification list: everything about a product that is a plain fact. */
@Component({
  selector: 'pf-product-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails {
  readonly product = input.required<ProductDto>();
}
