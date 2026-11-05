import { bootstrapApplication } from '@angular/platform-browser';
import { App, appConfig } from '@pf/web-finder-app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
