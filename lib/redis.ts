import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default redis;

// TTLs
export const VIDEO_TTL = 60 * 60 * 24 * 365; // 1 year
export const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
export const CODE_TTL = 60 * 60 * 24; // 24 hours
