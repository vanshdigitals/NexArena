/**
 * @jest-environment node
 *
 * Tests for lib/cloud-functions.ts — Cloud Functions helper utilities.
 * Tests verify type exports and SSR-safe no-ops when Firebase is unconfigured.
 */

jest.mock('@/lib/firebase', () => ({
  app: null,
  isConfigured: false,
}));

describe('Cloud Functions helpers — unconfigured', () => {
  let cloudFunctions: typeof import('@/lib/cloud-functions');

  beforeAll(async () => {
    cloudFunctions = await import('@/lib/cloud-functions');
  });

  it('callFunction returns error when Firebase is not configured', async () => {
    const result = await cloudFunctions.callFunction('testFn', { test: true });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not available');
  });

  it('sendAlertNotification returns error when unconfigured', async () => {
    const result = await cloudFunctions.sendAlertNotification({
      zone: 'gateA',
      severity: 'warning',
      message: 'Test alert',
    });
    expect(result.success).toBe(false);
  });

  it('batchUpdateDensity returns error when unconfigured', async () => {
    const result = await cloudFunctions.batchUpdateDensity({
      updates: [{ zone: 'gateA', density: 50 }],
    });
    expect(result.success).toBe(false);
  });

  it('exportAnalytics returns error when unconfigured', async () => {
    const result = await cloudFunctions.exportAnalytics({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      format: 'json',
    });
    expect(result.success).toBe(false);
  });

  it('CloudFunctionResponse shape has success and optional error', async () => {
    const result = await cloudFunctions.callFunction('any', {});
    expect(typeof result.success).toBe('boolean');
    if (!result.success) {
      expect(typeof result.error).toBe('string');
    }
  });

  it('response does not have data when call fails', async () => {
    const result = await cloudFunctions.callFunction('any', {});
    expect(result.data).toBeUndefined();
  });
});
