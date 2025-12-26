// Simple in-memory cache to track if an API call has been made during the current browser session.
// This allows us to skip API calls on client-side navigation (using IndexedDB instead),
// but ensures we fetch fresh data on browser refresh (F5), as this object is reset.

const sessionCache = new Set();

export const hasFetched = (key) => sessionCache.has(key);
export const markFetched = (key) => sessionCache.add(key);
export const clearSessionCache = () => sessionCache.clear();
