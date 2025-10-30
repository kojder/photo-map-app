import { getBrowserLocale } from './app.config';

describe('AppConfig - Locale Detection', () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    // Store original navigator for restoration
    originalNavigator = window.navigator;
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true
    });
  });

  describe('getBrowserLocale', () => {
    it('should return browser language when available', () => {
      // Mock navigator with Polish locale
      Object.defineProperty(window, 'navigator', {
        value: {
          language: 'pl-PL',
          languages: ['pl-PL', 'en-US']
        },
        writable: true,
        configurable: true
      });

      const locale = getBrowserLocale();
      expect(locale).toBe('pl-PL');
    });

    it('should return first language from languages array when language is not set', () => {
      // Mock navigator with only languages array
      Object.defineProperty(window, 'navigator', {
        value: {
          language: undefined,
          languages: ['en-US', 'pl-PL']
        },
        writable: true,
        configurable: true
      });

      const locale = getBrowserLocale();
      expect(locale).toBe('en-US');
    });

    it('should return en-US for English browser', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          language: 'en-US',
          languages: ['en-US']
        },
        writable: true,
        configurable: true
      });

      const locale = getBrowserLocale();
      expect(locale).toBe('en-US');
    });

    it('should return de-DE for German browser', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          language: 'de-DE',
          languages: ['de-DE', 'en-US']
        },
        writable: true,
        configurable: true
      });

      const locale = getBrowserLocale();
      expect(locale).toBe('de-DE');
    });

    it('should return fr-FR for French browser', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          language: 'fr-FR',
          languages: ['fr-FR']
        },
        writable: true,
        configurable: true
      });

      const locale = getBrowserLocale();
      expect(locale).toBe('fr-FR');
    });

    it('should return es-ES for Spanish browser', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          language: 'es-ES',
          languages: ['es-ES']
        },
        writable: true,
        configurable: true
      });

      const locale = getBrowserLocale();
      expect(locale).toBe('es-ES');
    });

    it('should fallback to pl-PL when navigator.language is not available', () => {
      // Mock navigator without language or languages
      Object.defineProperty(window, 'navigator', {
        value: {
          language: undefined,
          languages: undefined
        },
        writable: true,
        configurable: true
      });

      const locale = getBrowserLocale();
      expect(locale).toBe('pl-PL');
    });

    it('should fallback to pl-PL when navigator.language is empty string', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          language: '',
          languages: []
        },
        writable: true,
        configurable: true
      });

      const locale = getBrowserLocale();
      expect(locale).toBe('pl-PL');
    });

    it('should handle unsupported locale formats gracefully', () => {
      // Browser might return just language code without region (e.g., 'en' instead of 'en-US')
      Object.defineProperty(window, 'navigator', {
        value: {
          language: 'en',
          languages: ['en']
        },
        writable: true,
        configurable: true
      });

      const locale = getBrowserLocale();
      // Angular should handle 'en' and map it to appropriate locale
      expect(locale).toBe('en');
    });

    it('should prioritize navigator.language over navigator.languages[0]', () => {
      Object.defineProperty(window, 'navigator', {
        value: {
          language: 'pl-PL',
          languages: ['en-US', 'de-DE']
        },
        writable: true,
        configurable: true
      });

      const locale = getBrowserLocale();
      expect(locale).toBe('pl-PL');
    });
  });

  describe('Future user settings support', () => {
    it('should be prepared for user preference override (comment check)', () => {
      // This test verifies that code has comment about future user settings
      const functionString = getBrowserLocale.toString();
      
      // Check if code contains comment about user settings (future enhancement)
      expect(functionString).toContain('Future enhancement');
    });
  });
});
