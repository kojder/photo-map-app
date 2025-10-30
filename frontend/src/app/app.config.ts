import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';

// Import locale data for supported languages
import localePl from '@angular/common/locales/pl';
import localeEn from '@angular/common/locales/en';
import localeDe from '@angular/common/locales/de';
import localeFr from '@angular/common/locales/fr';
import localeEs from '@angular/common/locales/es';

import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jwt.interceptor';

// Register all supported locales
registerLocaleData(localePl);
registerLocaleData(localeEn);
registerLocaleData(localeDe);
registerLocaleData(localeFr);
registerLocaleData(localeEs);

/**
 * Detects browser locale and returns it for Angular's LOCALE_ID.
 * Falls back to Polish (pl-PL) if browser locale is not available.
 * 
 * Future: This will be extended to support user preferences from settings
 * (e.g., user can override browser locale in their profile).
 * 
 * @returns Browser locale string (e.g., 'pl-PL', 'en-US') or 'pl-PL' as fallback
 */
export function getBrowserLocale(): string {
  // Try to get browser language from navigator
  const browserLang = navigator.language || (navigator.languages && navigator.languages[0]);
  
  // Future enhancement: Check user settings here
  // const userLocale = getUserLocaleFromSettings();
  // if (userLocale) return userLocale;
  
  // Fallback to Polish if browser locale not available
  return browserLang || 'pl-PL';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    { provide: LOCALE_ID, useFactory: getBrowserLocale }
  ]
};
