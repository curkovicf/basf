import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ProductDto } from '@pf/shared-types';
import { StatusTag } from '@pf/web-finder-shared-ui';

@Component({
  selector: 'pf-product-header',
  imports: [ButtonDirective, StatusTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-header.html',
  styleUrl: './product-header.scss',
})
export class ProductHeader {
  readonly product = input.required<ProductDto>();
  readonly share = output<void>();
}
