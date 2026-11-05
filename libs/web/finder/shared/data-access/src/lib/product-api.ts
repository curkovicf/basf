import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CatalogStatusDto,
  CreateReviewRequest,
  CreatedReviewDto,
  ProductDto,
  ProductPageDto,
  ReviewPageDto,
} from '@pf/shared-types';

export type ApiParams = Record<string, string | number | string[]>;

/** The one HTTP client of the app. Same origin: nginx (or the dev proxy) forwards `/api`. */
@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);

  search(params: ApiParams): Observable<ProductPageDto> {
    return this.http.get<ProductPageDto>('/api/products', {
      params: new HttpParams({ fromObject: params }),
    });
  }

  product(sku: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`/api/products/${encodeURIComponent(sku)}`);
  }

  reviews(sku: string, page: number): Observable<ReviewPageDto> {
    return this.http.get<ReviewPageDto>(`/api/products/${encodeURIComponent(sku)}/reviews`, {
      params: { page },
    });
  }

  createReview(sku: string, review: CreateReviewRequest): Observable<CreatedReviewDto> {
    return this.http.post<CreatedReviewDto>(
      `/api/products/${encodeURIComponent(sku)}/reviews`,
      review,
    );
  }

  catalogStatus(): Observable<CatalogStatusDto> {
    return this.http.get<CatalogStatusDto>('/api/catalog/status');
  }
}
