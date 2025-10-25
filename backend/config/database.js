const redacted = (value = '') => {
  if (!value) return '[empty]';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

const PRIMARY_KEYS = [
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'POSTGRES_URL_NON_POOLING',
  'SUPABASE_DB_URL',
  'SUPABASE_POSTGRES_URL',
  'DATABASE_URL'
];

const detectConnectionString = () => {
  for (const key of PRIMARY_KEYS) {
    const candidate = process.env[key];
    if (candidate && typeof candidate === 'string' && candidate.trim()) {
      return { key, value: candidate.trim() };
    }
  }

  const fallbackKey = Object.keys(process.env).find((envKey) =>
    /^postgres(ql)?:\/\//i.test(process.env[envKey] || '')
  );

  return fallbackKey
    ? { key: fallbackKey, value: process.env[fallbackKey].trim() }
    : null;
};

const connection = detectConnectionString();
const allowKvFallback = process.env.ALLOW_KV_FALLBACK === 'true';
const isProdLike =
  ['production', 'preview'].includes(String(process.env.VERCEL_ENV).toLowerCase()) ||
  String(process.env.NODE_ENV).toLowerCase() === 'production' ||
  String(process.env.VERCEL || '').toLowerCase() === '1';

if (!connection && !allowKvFallback) {
  const message =
    'No Postgres connection string found. Vercel Storage (Neon) is required for this project. ' +
    'Please link Postgres and expose POSTGRES_URL / POSTGRES_PRISMA_URL to the deployment.';
  console.error('[database] ❌', message);
  throw new Error(message);
}

if (connection) {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = connection.value;
  }

  console.log('[database] ✅ Using Postgres via', connection.key, redacted(connection.value));
  module.exports = require('./neon');
} else {
  if (!isProdLike) {
    console.warn('[database] ⚠️ Falling back to in-memory KV store (development only).');
  } else {
    console.warn('[database] ⚠️ ALLOW_KV_FALLBACK enabled – using in-memory KV as a last resort.');
  }

  const mockKV = {
    map: new Map(),
    sets: new Map(),

    async hset(key, values = {}) {
      const current = this.map.get(key) || {};
      this.map.set(key, { ...current, ...values });
      return true;
    },

    async hgetall(key) {
      return this.map.get(key) || {};
    },

    async hget(key, field) {
      const obj = this.map.get(key) || {};
      return obj[field] ?? null;
    },

    async sadd(key, value) {
      if (!this.sets.has(key)) {
        this.sets.set(key, new Set());
      }
      this.sets.get(key).add(value);
      return true;
    },

    async smembers(key) {
      return Array.from(this.sets.get(key) || []);
    },

    async srem(key, value) {
      this.sets.get(key)?.delete(value);
      return true;
    },

    async del(key) {
      this.map.delete(key);
      this.sets.delete(key);
      return true;
    }
  };

  const kvDatabase = require('./kv');
  kvDatabase.kv = mockKV;
  module.exports = kvDatabase;
}
