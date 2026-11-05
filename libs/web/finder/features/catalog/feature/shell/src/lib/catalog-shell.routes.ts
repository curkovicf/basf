import { Routes } from '@angular/router';

/** Entry point of the catalog feature; the app decides where it is mounted. */
export const CatalogRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Product Finder',
    loadComponent: () =>
      import('@pf/web-finder-features-catalog-feature-page').then((m) => m.CatalogPage),
  },
];
