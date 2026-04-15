/**
 * @jest-environment node
 *
 * Tests for lib/firestore.ts — Firestore helper functions.
 *
 * Two scenarios:
 *   1. Firebase unconfigured (db === null) — all guards return safe defaults.
 *   2. Firebase configured (db mocked) — functions call Firestore SDK correctly.
 */

/* ── Firestore SDK mocks ──────────────────────────────────────────────── */

const mockSetDoc = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockOnSnapshot = jest.fn();
const mockDoc = jest.fn().mockReturnValue({ id: 'mock-doc-id' });
const mockCollection = jest.fn().mockReturnValue('mock-collection-ref');

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  serverTimestamp: () => 'MOCK_TIMESTAMP',
}));

/* ══════════════════════════════════════════════════════════════════════════
   SCENARIO 1: Firebase NOT configured (db === null)
   ══════════════════════════════════════════════════════════════════════════ */

describe('Firestore helpers — unconfigured (db = null)', () => {
  let firestore: typeof import('@/lib/firestore');

  beforeAll(() => {
    jest.isolateModules(() => {
      jest.doMock('@/lib/firebase', () => ({
        db: null,
        auth: null,
        app: null,
        isConfigured: false,
      }));
      firestore = require('@/lib/firestore');
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updateZoneDensity no-ops when db is null', async () => {
    await expect(firestore.updateZoneDensity('gateA', 50)).resolves.toBeUndefined();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('getZoneDensities returns {} when db is null', async () => {
    const result = await firestore.getZoneDensities();
    expect(result).toEqual({});
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it('subscribeToZoneDensity returns no-op unsubscribe when db is null', () => {
    const callback = jest.fn();
    const unsub = firestore.subscribeToZoneDensity(callback);
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });

  it('publishAlert returns empty string when db is null', async () => {
    const result = await firestore.publishAlert({
      message: 'Evacuation notice',
      severity: 'critical',
      zone: 'gateA',
    });
    expect(result).toBe('');
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('subscribeToAlerts returns no-op unsubscribe when db is null', () => {
    const callback = jest.fn();
    const unsub = firestore.subscribeToAlerts(callback);
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('getActiveEvent returns null when db is null', async () => {
    const result = await firestore.getActiveEvent();
    expect(result).toBeNull();
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it('updateActiveEvent no-ops when db is null', async () => {
    await expect(
      firestore.updateActiveEvent({ name: 'Test Match' })
    ).resolves.toBeUndefined();
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   SCENARIO 2: Firebase configured (db mocked)
   ══════════════════════════════════════════════════════════════════════════ */

describe('Firestore helpers — configured (db mocked)', () => {
  let firestore: typeof import('@/lib/firestore');

  beforeAll(() => {
    jest.isolateModules(() => {
      jest.doMock('@/lib/firebase', () => ({
        db: { type: 'firestore' }, // truthy mock
        auth: {},
        app: {},
        isConfigured: true,
      }));
      firestore = require('@/lib/firestore');
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updateZoneDensity calls setDoc with merge', async () => {
    await firestore.updateZoneDensity('gateA', 65);
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      { gateA: 65, updatedAt: 'MOCK_TIMESTAMP' },
      { merge: true }
    );
  });

  it('getZoneDensities returns data when document exists', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ gateA: 42, gateB: 78, foodCourt: 15, sectionD: 60 }),
    });
    const result = await firestore.getZoneDensities();
    expect(result).toEqual({ gateA: 42, gateB: 78, foodCourt: 15, sectionD: 60 });
  });

  it('getZoneDensities returns {} when document does not exist', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
      data: () => null,
    });
    const result = await firestore.getZoneDensities();
    expect(result).toEqual({});
  });

  it('subscribeToZoneDensity registers an onSnapshot listener', () => {
    const callback = jest.fn();
    mockOnSnapshot.mockReturnValue(jest.fn()); // mock unsubscribe
    firestore.subscribeToZoneDensity(callback);
    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
  });

  it('publishAlert calls setDoc and returns document id', async () => {
    const id = await firestore.publishAlert({
      message: 'Gate B closed',
      severity: 'warning',
      zone: 'gateB',
    });
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(typeof id).toBe('string');
  });

  it('subscribeToAlerts registers an onSnapshot listener', () => {
    const callback = jest.fn();
    mockOnSnapshot.mockReturnValue(jest.fn());
    firestore.subscribeToAlerts(callback);
    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  it('getActiveEvent returns data when event exists', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ name: 'Grand Final', venue: 'NexArena' }),
    });
    const result = await firestore.getActiveEvent();
    expect(result).toEqual({ name: 'Grand Final', venue: 'NexArena' });
  });

  it('getActiveEvent returns null when no active event', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
      data: () => null,
    });
    const result = await firestore.getActiveEvent();
    expect(result).toBeNull();
  });

  it('updateActiveEvent calls updateDoc with timestamp', async () => {
    await firestore.updateActiveEvent({ name: 'Semi Final' });
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      { name: 'Semi Final', updatedAt: 'MOCK_TIMESTAMP' }
    );
  });
});
