import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReviewDto } from '@pf/shared-types';
import { ReviewStars } from '../review-stars/review-stars';

@Component({
  selector: 'pf-review-card',
  imports: [DatePipe, ReviewStars],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-card.html',
  styleUrl: './review-card.scss',
})
export class ReviewCard {
  readonly review = input.required<ReviewDto>();
  protected readonly initial = computed(() =>
    this.review().authorName.trim().charAt(0).toUpperCase(),
  );
}
