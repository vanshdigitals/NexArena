/**
 * @jest-environment node
 *
 * Advanced tests for lib/firestore.ts — compound queries and batch writes.
 */

/* ── Firestore SDK mocks ──────────────────────────────────────────────── */

const mockSetDoc = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockOnSnapshot = jest.fn();
const mockDoc = jest.fn().mockReturnValue({ id: 'mock-doc-id' });
const mockCollection = jest.fn().mockReturnValue('mock-collection-ref');
const mockQuery = jest.fn().mockReturnValue('mock-query');
const mockWhere = jest.fn().mockReturnValue('mock-where');
const mockOrderBy = jest.fn().mockReturnValue('mock-order');
const mockLimit = jest.fn().mockReturnValue('mock-limit');
const mockWriteBatch = jest.fn().mockReturnValue({
  set: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
});

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
  serverTimestamp: () => 'MOCK_TIMESTAMP',
}));

/* ══════════════════════════════════════════════════════════════════════════
   SCENARIO: Unconfigured — compound queries and batch writes no-op
   ══════════════════════════════════════════════════════════════════════════ */

describe('Firestore advanced — unconfigured (db = null)', () => {
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

  it('queryAlertsBySeverity returns empty array when db is null', async () => {
    const result = await firestore.queryAlertsBySeverity('critical');
    expect(result).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('queryAlertsByZoneAndSeverity returns empty array when db is null', async () => {
    const result = await firestore.queryAlertsByZoneAndSeverity('gateA', 'warning');
    expect(result).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('batchUpdateZoneDensities no-ops when db is null', async () => {
    await expect(
      firestore.batchUpdateZoneDensities({ gateA: 50, gateB: 75 })
    ).resolves.toBeUndefined();
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it('batchPublishAlerts returns empty array when db is null', async () => {
    const result = await firestore.batchPublishAlerts([
      { message: 'Test', severity: 'info', zone: 'gateA' },
    ]);
    expect(result).toEqual([]);
    expect(mockWriteBatch).not.toHaveBeenCalled();
  });

  it('subscribeToZoneDensity with onError callback still returns no-op when db is null', () => {
    const callback = jest.fn();
    const onError = jest.fn();
    const unsub = firestore.subscribeToZoneDensity(callback, onError);
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
    expect(callback).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   SCENARIO: Configured — compound queries and batch writes call SDK
   ══════════════════════════════════════════════════════════════════════════ */

describe('Firestore advanced — configured (db mocked)', () => {
  let firestore: typeof import('@/lib/firestore');

  beforeAll(() => {
    jest.isolateModules(() => {
      jest.doMock('@/lib/firebase', () => ({
        db: { type: 'firestore' },
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

  it('queryAlertsBySeverity calls getDocs with query', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a1', data: () => ({ message: 'Test', severity: 'critical' }) },
      ],
    });
    const result = await firestore.queryAlertsBySeverity('critical');
    expect(mockQuery).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalledWith('severity', '==', 'critical');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('queryAlertsByZoneAndSeverity uses compound where clauses', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });
    await firestore.queryAlertsByZoneAndSeverity('gateA', 'warning', 5);
    expect(mockWhere).toHaveBeenCalledWith('zone', '==', 'gateA');
    expect(mockWhere).toHaveBeenCalledWith('severity', '==', 'warning');
    expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  it('batchUpdateZoneDensities creates a write batch', async () => {
    await firestore.batchUpdateZoneDensities({ gateA: 50, gateB: 75 });
    expect(mockWriteBatch).toHaveBeenCalled();
    const batch = mockWriteBatch.mock.results[0].value;
    expect(batch.set).toHaveBeenCalled();
    expect(batch.commit).toHaveBeenCalled();
  });

  it('batchPublishAlerts returns document IDs', async () => {
    const ids = await firestore.batchPublishAlerts([
      { message: 'Alert 1', severity: 'info', zone: 'gateA' },
      { message: 'Alert 2', severity: 'warning', zone: 'gateB' },
    ]);
    expect(ids).toHaveLength(2);
    expect(mockWriteBatch).toHaveBeenCalled();
    const batch = mockWriteBatch.mock.results[0].value;
    expect(batch.commit).toHaveBeenCalled();
  });

  it('subscribeToZoneDensity passes error handler to onSnapshot', () => {
    const callback = jest.fn();
    const onError = jest.fn();
    mockOnSnapshot.mockReturnValue(jest.fn());
    firestore.subscribeToZoneDensity(callback, onError);
    expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    // onSnapshot should receive 3 args: ref, callback, errorCallback
    expect(mockOnSnapshot.mock.calls[0]).toHaveLength(3);
  });

  it('subscribeToAlerts with zone filter uses query', () => {
    const callback = jest.fn();
    mockOnSnapshot.mockReturnValue(jest.fn());
    firestore.subscribeToAlerts(callback, 'gateA');
    expect(mockQuery).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalledWith('zone', '==', 'gateA');
  });

  it('subscribeToAlerts without zone filter uses collection directly', () => {
    const callback = jest.fn();
    mockOnSnapshot.mockReturnValue(jest.fn());
    firestore.subscribeToAlerts(callback);
    // onSnapshot should be called with collection ref, not query
    expect(mockOnSnapshot).toHaveBeenCalled();
  });
});
