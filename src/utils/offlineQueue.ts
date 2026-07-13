/**
 * Offline Queue Manager
 * Uses IndexedDB to store clock-ins, checkpoint scans, and reports when offline.
 * Auto-syncs when connectivity is restored.
 */

const DB_NAME = 'bh_offline_queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending_actions';

export interface OfflineAction {
  id?: number;
  type: 'clock_in' | 'clock_out' | 'checkpoint_scan' | 'patrol_entry' | 'incident_report' | 'dob_entry';
  payload: Record<string, any>;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const enqueueAction = async (action: Omit<OfflineAction, 'id' | 'retryCount' | 'status'>): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add({
      ...action,
      retryCount: 0,
      status: 'pending',
    });
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

export const getPendingActions = async (): Promise<OfflineAction[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('status');
    const request = index.getAll('pending');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllActions = async (): Promise<OfflineAction[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const removeAction = async (id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateActionStatus = async (id: number, status: OfflineAction['status'], retryCount?: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const action = getRequest.result;
      if (action) {
        action.status = status;
        if (retryCount !== undefined) action.retryCount = retryCount;
        store.put(action);
      }
      resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const getQueueCount = async (): Promise<number> => {
  const actions = await getPendingActions();
  return actions.length;
};

export const isOnline = (): boolean => navigator.onLine;

export const clearSyncedActions = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
