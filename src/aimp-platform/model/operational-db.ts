import type { EntityRecord, RoleId } from '../types';
import type { DomainEvent } from './domain-events';

export type PersistedSnapshot = {
    currentRole: RoleId;
    entities: EntityRecord[];
    revision: number;
    outbox?: DomainEvent[];
};

const databaseName = 'aimp-operational-prototype';
const storeName = 'state';
const snapshotKey = 'prototype';

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(storeName)) {
            request.result.createObjectStore(storeName);
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

export async function loadOperationalSnapshot(): Promise<PersistedSnapshot | undefined> {
    if (typeof indexedDB === 'undefined') return undefined;
    try {
        const database = await openDatabase();
        return await new Promise((resolve, reject) => {
            const transaction = database.transaction(storeName, 'readonly');
            const request = transaction.objectStore(storeName).get(snapshotKey);
            request.onsuccess = () => resolve(request.result as PersistedSnapshot | undefined);
            request.onerror = () => reject(request.error);
            transaction.oncomplete = () => database.close();
        });
    } catch {
        return undefined;
    }
}

export async function saveOperationalSnapshot(snapshot: PersistedSnapshot): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    try {
        const database = await openDatabase();
        await new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(storeName, 'readwrite');
            transaction.objectStore(storeName).put(snapshot, snapshotKey);
            transaction.oncomplete = () => {
                database.close();
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        });
    } catch {
        // The in-memory store remains usable when persistence is unavailable.
    }
}

export async function clearOperationalSnapshot(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    try {
        const database = await openDatabase();
        await new Promise<void>((resolve, reject) => {
            const transaction = database.transaction(storeName, 'readwrite');
            transaction.objectStore(storeName).delete(snapshotKey);
            transaction.oncomplete = () => {
                database.close();
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        });
    } catch {
        // Reset still succeeds in memory.
    }
}
