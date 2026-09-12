import Redis from 'ioredis';
import { CONFIG } from '../config';

class MemoryStore {
  private store = new Map<string, { value: string; expireAt?: number }>();
  private sets = new Map<string, Set<string>>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string | null> {
    let expireAt: number | undefined = undefined;
    if (mode === 'EX' && duration) {
      expireAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expireAt = Date.now() + duration;
    }
    this.store.set(key, { value, expireAt });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key)) deleted++;
      if (this.sets.delete(key)) deleted++;
    }
    return deleted;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    let set = this.sets.get(key);
    if (!set) {
      set = new Set();
      this.sets.set(key, set);
    }
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.sets.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) removed++;
    }
    return removed;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.sets.get(key);
    return set ? Array.from(set) : [];
  }

  async scard(key: string): Promise<number> {
    const set = this.sets.get(key);
    return set ? set.size : 0;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const val = (current ? parseInt(current, 10) : 0) + 1;
    await this.set(key, val.toString());
    return val;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (item) {
      item.expireAt = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }
}

export interface ICacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  scard(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  isFallback: boolean;
}

let redisClient: ICacheClient;
const memoryFallback = new MemoryStore();

try {
  const redis = new Redis(CONFIG.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 2) return null; // stop retrying to use fallback
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    console.warn('[Redis] Connection issue, using memory fallback:', err.message);
  });

  redisClient = {
    get: (k) => redis.get(k).catch(() => memoryFallback.get(k)),
    set: (k, v, mode, dur) => redis.set(k, v, mode as any, dur as any).catch(() => memoryFallback.set(k, v, mode, dur)),
    del: (...keys) => redis.del(...keys).catch(() => memoryFallback.del(...keys)),
    sadd: (k, ...m) => redis.sadd(k, ...m).catch(() => memoryFallback.sadd(k, ...m)),
    srem: (k, ...m) => redis.srem(k, ...m).catch(() => memoryFallback.srem(k, ...m)),
    smembers: (k) => redis.smembers(k).catch(() => memoryFallback.smembers(k)),
    scard: (k) => redis.scard(k).catch(() => memoryFallback.scard(k)),
    incr: (k) => redis.incr(k).catch(() => memoryFallback.incr(k)),
    expire: (k, s) => redis.expire(k, s).catch(() => memoryFallback.expire(k, s)),
    isFallback: false,
  };
} catch {
  console.warn('[Redis] Using in-memory fallback client.');
  redisClient = {
    get: (k) => memoryFallback.get(k),
    set: (k, v, mode, dur) => memoryFallback.set(k, v, mode, dur),
    del: (...keys) => memoryFallback.del(...keys),
    sadd: (k, ...m) => memoryFallback.sadd(k, ...m),
    srem: (k, ...m) => memoryFallback.srem(k, ...m),
    smembers: (k) => memoryFallback.smembers(k),
    scard: (k) => memoryFallback.scard(k),
    incr: (k) => memoryFallback.incr(k),
    expire: (k, s) => memoryFallback.expire(k, s),
    isFallback: true,
  };
}

export { redisClient };
