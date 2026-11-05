import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ReviewDto } from '@pf/shared-types';
import { LoadError } from '@pf/web-finder-shared-ui';
import { ReviewCard } from '../review-card/review-card';

/** The reviews loaded so far, with the empty, failed and "more to load" states. */
@Component({
  selector: 'pf-review-list',
  imports: [ButtonDirective, LoadError, ReviewCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-list.html',
  styleUrl: './review-list.scss',
})
export class ReviewList {
  readonly reviews = input.required<ReviewDto[]>();
  readonly loading = input(false);
  readonly failed = input(false);
  readonly hasMore = input(false);
  readonly retry = output<void>();
  readonly loadMore = output<void>();
}
