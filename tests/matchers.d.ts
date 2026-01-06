/**
 * Custom Jest Matcher Type Declarations
 */

export {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUrl(): R;
      toBeValidCdnId(): R;
    }
  }
}
