import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductDto } from '@pf/shared-types';
import { RatingBadge, StatusTag } from '@pf/web-finder-shared-ui';

@Component({
  selector: 'pf-product-card',
  imports: [RouterLink, RatingBadge, StatusTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  readonly product = input.required<ProductDto>();
}
