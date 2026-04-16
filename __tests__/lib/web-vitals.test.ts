/**
 * @jest-environment node
 *
 * Tests for lib/web-vitals.ts — Web Vitals rating functions.
 * Note: observeWebVitals and reportWebVitalsToAnalytics are browser-only
 * and require a jsdom/browser environment. We test the pure rating functions
 * and verify that browser-only functions no-op in Node.
 */

import {
  rateCLS,
  rateFID,
  rateLCP,
  rateFCP,
  rateTTFB,
  observeWebVitals,
  reportWebVitalsToAnalytics,
} from '@/lib/web-vitals';

describe('Web Vitals — rateCLS', () => {
  it('rates 0 as good', () => {
    expect(rateCLS(0)).toBe('good');
  });

  it('rates 0.1 as good (boundary)', () => {
    expect(rateCLS(0.1)).toBe('good');
  });

  it('rates 0.15 as needs-improvement', () => {
    expect(rateCLS(0.15)).toBe('needs-improvement');
  });

  it('rates 0.25 as needs-improvement (boundary)', () => {
    expect(rateCLS(0.25)).toBe('needs-improvement');
  });

  it('rates 0.3 as poor', () => {
    expect(rateCLS(0.3)).toBe('poor');
  });
});

describe('Web Vitals — rateFID', () => {
  it('rates 50 as good', () => {
    expect(rateFID(50)).toBe('good');
  });

  it('rates 100 as good (boundary)', () => {
    expect(rateFID(100)).toBe('good');
  });

  it('rates 200 as needs-improvement', () => {
    expect(rateFID(200)).toBe('needs-improvement');
  });

  it('rates 300 as needs-improvement (boundary)', () => {
    expect(rateFID(300)).toBe('needs-improvement');
  });

  it('rates 400 as poor', () => {
    expect(rateFID(400)).toBe('poor');
  });
});

describe('Web Vitals — rateLCP', () => {
  it('rates 1000 as good', () => {
    expect(rateLCP(1000)).toBe('good');
  });

  it('rates 2500 as good (boundary)', () => {
    expect(rateLCP(2500)).toBe('good');
  });

  it('rates 3000 as needs-improvement', () => {
    expect(rateLCP(3000)).toBe('needs-improvement');
  });

  it('rates 4000 as needs-improvement (boundary)', () => {
    expect(rateLCP(4000)).toBe('needs-improvement');
  });

  it('rates 5000 as poor', () => {
    expect(rateLCP(5000)).toBe('poor');
  });
});

describe('Web Vitals — rateFCP', () => {
  it('rates 1000 as good', () => {
    expect(rateFCP(1000)).toBe('good');
  });

  it('rates 1800 as good (boundary)', () => {
    expect(rateFCP(1800)).toBe('good');
  });

  it('rates 2500 as needs-improvement', () => {
    expect(rateFCP(2500)).toBe('needs-improvement');
  });

  it('rates 3500 as poor', () => {
    expect(rateFCP(3500)).toBe('poor');
  });
});

describe('Web Vitals — rateTTFB', () => {
  it('rates 500 as good', () => {
    expect(rateTTFB(500)).toBe('good');
  });

  it('rates 800 as good (boundary)', () => {
    expect(rateTTFB(800)).toBe('good');
  });

  it('rates 1200 as needs-improvement', () => {
    expect(rateTTFB(1200)).toBe('needs-improvement');
  });

  it('rates 2000 as poor', () => {
    expect(rateTTFB(2000)).toBe('poor');
  });
});

describe('Web Vitals — browser-only functions in Node', () => {
  it('observeWebVitals no-ops in Node (no window)', () => {
    const callback = jest.fn();
    expect(() => observeWebVitals(callback)).not.toThrow();
    expect(callback).not.toHaveBeenCalled();
  });

  it('reportWebVitalsToAnalytics no-ops in Node', () => {
    expect(() => reportWebVitalsToAnalytics()).not.toThrow();
  });
});
