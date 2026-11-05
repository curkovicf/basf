import { ComponentFixture, TestBed } from '@angular/core/testing';
import { providePrimeNG } from 'primeng/config';
import { ReviewDto } from '@pf/shared-types';
import { ReviewList } from './review-list';

const review = (id: number): ReviewDto => ({
  id,
  authorName: `Author ${id}`,
  rating: 4,
  comment: `Comment ${id}`,
  createdAt: '2026-01-01T00:00:00Z',
});

describe('ReviewList', () => {
  let fixture: ComponentFixture<ReviewList>;
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [providePrimeNG()] });
    fixture = TestBed.createComponent(ReviewList);
  });

  it('says so when there are no reviews, but not while loading', async () => {
    fixture.componentRef.setInput('reviews', []);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();
    expect(text()).not.toContain('No reviews yet');

    fixture.componentRef.setInput('loading', false);
    await fixture.whenStable();
    expect(text()).toContain('No reviews yet');
  });

  it('lists reviews and offers more only while there are more', async () => {
    fixture.componentRef.setInput('reviews', [review(1), review(2)]);
    fixture.componentRef.setInput('hasMore', true);
    await fixture.whenStable();
    expect(text()).toContain('Author 1');
    expect(text()).toContain('Show more reviews');

    fixture.componentRef.setInput('hasMore', false);
    await fixture.whenStable();
    expect(text()).not.toContain('Show more reviews');
  });

  it('asks to retry when loading failed', async () => {
    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => (retries += 1));
    fixture.componentRef.setInput('reviews', []);
    fixture.componentRef.setInput('failed', true);
    await fixture.whenStable();

    expect(text()).toContain("couldn't load reviews");
    expect(text()).not.toContain('No reviews yet');
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    expect(retries).toBe(1);
  });
});
