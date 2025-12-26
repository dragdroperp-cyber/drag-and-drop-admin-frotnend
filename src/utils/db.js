const DB_NAME = 'AdminPanelDB';
const DB_VERSION = 1;
const STORE_NAME = 'api_cache';

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

export const adminDB = {
    async get(key) {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error("Error getting data from DB:", error);
            return null;
        }
    },

    async set(key, value) {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(value, key);

                request.onsuccess = () => {
                    resolve(true);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error("Error setting data in DB:", error);
            return false;
        }
    },

    async delete(key) {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(key);

                request.onsuccess = () => {
                    resolve(true);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error("Error deleting from DB:", error);
            return false;
        }
    }
};
