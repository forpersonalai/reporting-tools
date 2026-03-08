import { LRUCache } from "lru-cache";

const rateLimitCache = new LRUCache<string, number[]>({
  max: 10_000,
  ttl: 1000 * 60 * 60,
});

export function rateLimit(identifier: string, limit = Number(process.env.RATE_LIMIT_PER_HOUR ?? 1000)) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const windowStart = now - windowMs;
  const requests = (rateLimitCache.get(identifier) ?? []).filter((timestamp) => timestamp > windowStart);

  if (requests.length >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: requests[0] + windowMs,
      limit,
    };
  }

  requests.push(now);
  rateLimitCache.set(identifier, requests);

  return {
    success: true,
    remaining: limit - requests.length,
    reset: now + windowMs,
    limit,
  };
}
