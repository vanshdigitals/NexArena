/**
 * @jest-environment node
 *
 * Tests for lib/analytics.ts — Firebase Analytics integration.
 * Validates that analytics helpers no-op safely in non-browser environments.
 */

jest.mock('@/lib/firebase', () => ({
  app: null,
  isConfigured: false,
}));

describe('Analytics helpers — SSR / unconfigured', () => {
  let analytics: typeof import('@/lib/analytics');

  beforeAll(async () => {
    analytics = await import('@/lib/analytics');
  });

  it('initAnalytics does not throw when app is null', async () => {
    await expect(analytics.initAnalytics()).resolves.toBeUndefined();
  });

  it('logEvent does not throw when analytics is uninitialized', () => {
    expect(() => analytics.logEvent('test_event', { key: 'value' })).not.toThrow();
  });

  it('logChatMessageSent does not throw', () => {
    expect(() => analytics.logChatMessageSent(42)).not.toThrow();
  });

  it('logChatResponseReceived does not throw', () => {
    expect(() => analytics.logChatResponseReceived(120)).not.toThrow();
  });

  it('logZoneClicked does not throw', () => {
    expect(() => analytics.logZoneClicked('gate-a', 65)).not.toThrow();
  });

  it('logQuickActionUsed does not throw', () => {
    expect(() => analytics.logQuickActionUsed('Find Restroom')).not.toThrow();
  });

  it('logSignIn does not throw', () => {
    expect(() => analytics.logSignIn('google')).not.toThrow();
  });

  it('logPageView does not throw', () => {
    expect(() => analytics.logPageView('home')).not.toThrow();
  });
});
