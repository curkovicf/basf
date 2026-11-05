import { WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { providePrimeNG } from 'primeng/config';
import { CreateReviewRequest } from '@pf/shared-types';
import { ReviewForm } from './review-form';

describe('ReviewForm', () => {
  let fixture: ComponentFixture<ReviewForm>;
  let submitted: CreateReviewRequest[];

  const element = () => fixture.nativeElement as HTMLElement;
  /** The form's model signal: the single source of truth behind the signal form. */
  const model = () =>
    (
      fixture.componentInstance as unknown as {
        model: WritableSignal<{ rating: number | null; authorName: string; comment: string }>;
      }
    ).model;
  const submit = async () => {
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };
  const fillValid = () =>
    model().set({ rating: 4, authorName: '  Ana  ', comment: '  Works well at low dose.  ' });

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [providePrimeNG()] });
    fixture = TestBed.createComponent(ReviewForm);
    submitted = [];
    fixture.componentInstance.submitted.subscribe((value) => submitted.push(value));
    await fixture.whenStable();
  });

  it('does not submit invalid input, and explains what is wrong', async () => {
    await submit();

    expect(submitted).toEqual([]);
    expect(element().textContent).toContain('choose a rating');
    expect(element().textContent).toContain('at least 2 characters');
    expect(element().textContent).toContain('at least 10 characters');
  });

  it('treats a whitespace-only comment as empty', async () => {
    model().set({ rating: 4, authorName: 'Ana', comment: '               ' });
    await submit();
    expect(submitted).toEqual([]);
  });

  it('hands up trimmed values', async () => {
    fillValid();
    await submit();

    expect(submitted).toEqual([
      { rating: 4, authorName: 'Ana', comment: 'Works well at low dose.' },
    ]);
  });

  it('cannot double-post while a submission is in flight', async () => {
    fillValid();
    fixture.componentRef.setInput('status', 'submitting');
    await submit();
    expect(submitted).toEqual([]);
  });

  it('clears the form and says thanks once the parent reports success', async () => {
    fillValid();
    fixture.componentRef.setInput('status', 'success');
    await fixture.whenStable();

    expect(model()().comment).toBe('');
    expect(model()().rating).toBeNull();
    expect(element().textContent).toContain('has been published');
  });

  it('keeps what the user wrote and shows the reason when saving fails', async () => {
    fillValid();
    fixture.componentRef.setInput('status', 'error');
    fixture.componentRef.setInput('errorMessage', 'Please wait a minute.');
    await fixture.whenStable();

    expect(element().textContent).toContain('wait a minute');
    expect(model()().authorName).toBe('  Ana  ');
  });
});
