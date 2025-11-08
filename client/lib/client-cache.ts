/**
 * Client-side cache utility using localStorage with TTL
 */

interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class ClientCache {
    private prefix = 'vp_cache_';

    /**
     * Set data in cache with TTL (Time To Live)
     * @param key Cache key
     * @param data Data to cache
     * @param ttl Time to live in seconds
     */
    set<T>(key: string, data: T, ttl: number): void {
        if (typeof window === 'undefined') return;

        const now = Date.now();
        const item: CacheItem<T> = {
            data,
            timestamp: now,
            expiresAt: now + ttl * 1000,
        };

        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
        } catch (error) {
            console.warn('Failed to cache data:', error);
        }
    }

    /**
     * Get data from cache if not expired
     * @param key Cache key
     * @returns Cached data or null if expired/not found
     */
    get<T>(key: string): T | null {
        if (typeof window === 'undefined') return null;

        try {
            const cached = localStorage.getItem(this.prefix + key);
            if (!cached) return null;

            const item: CacheItem<T> = JSON.parse(cached);
            const now = Date.now();

            // Check if expired
            if (now > item.expiresAt) {
                this.delete(key);
                return null;
            }

            return item.data;
        } catch (error) {
            console.warn('Failed to retrieve cache:', error);
            return null;
        }
    }

    /**
     * Delete specific cache entry
     * @param key Cache key
     */
    delete(key: string): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(this.prefix + key);
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        if (typeof window === 'undefined') return;

        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Clear expired cache entries
     */
    clearExpired(): void {
        if (typeof window === 'undefined') return;

        const now = Date.now();
        const keys = Object.keys(localStorage);

        keys.forEach((key) => {
            if (!key.startsWith(this.prefix)) return;

            try {
                const cached = localStorage.getItem(key);
                if (!cached) return;

                const item: CacheItem<any> = JSON.parse(cached);
                if (now > item.expiresAt) {
                    localStorage.removeItem(key);
                }
            } catch (error) {
                // Invalid cache entry, remove it
                localStorage.removeItem(key);
            }
        });
    }
}

export const clientCache = new ClientCache();

// Clear expired cache on page load
if (typeof window !== 'undefined') {
    clientCache.clearExpired();
}
