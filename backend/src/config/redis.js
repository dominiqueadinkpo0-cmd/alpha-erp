const Redis = require('ioredis');

const client = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableReadyCheck: false
});

let connected = false;

client.on('connect', () => {
  connected = true;
  console.log('Redis connected');
});

client.on('error', (err) => {
  connected = false;
  console.warn('Redis connection error:', err.message);
});

client.on('close', () => {
  connected = false;
});

async function connect() {
  try {
    await client.connect();
  } catch (err) {
    console.warn('Redis not available, caching disabled:', err.message);
  }
}

function isConnected() {
  return connected;
}

async function getCache(key) {
  if (!connected) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn('Redis getCache error:', err.message);
    return null;
  }
}

async function setCache(key, value, ttlSeconds) {
  if (!connected) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.warn('Redis setCache error:', err.message);
  }
}

async function deleteCache(key) {
  if (!connected) return;
  try {
    await client.del(key);
  } catch (err) {
    console.warn('Redis deleteCache error:', err.message);
  }
}

async function flushPattern(pattern) {
  if (!connected) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (err) {
    console.warn('Redis flushPattern error:', err.message);
  }
}

connect();

module.exports = { client, isConnected, getCache, setCache, deleteCache, flushPattern };
