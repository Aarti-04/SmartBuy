import os
import logging
from typing import Optional
from dotenv import load_dotenv
load_dotenv()

from redis.asyncio import Redis, from_url
from redis.exceptions import ConnectionError as RedisConnectionError, TimeoutError as RedisTimeoutError

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Global async Redis client instance
_redis_client: Optional[Redis] = None

def get_redis_client() -> Optional[Redis]:
    """
    Retrieves or initializes the async Redis client.
    """
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = from_url(REDIS_URL, decode_responses=True)
            logger.info(f"Initialized Redis client connecting to {REDIS_URL}")
        except Exception as e:
            logger.warning(f"Failed to initialize Redis client with URL {REDIS_URL}: {e}")
            _redis_client = None
    return _redis_client

async def get_cached(key: str) -> Optional[str]:
    """
    Retrieves a cached value from Redis by key.
    If Redis is down or unavailable, logs a warning and returns None.
    """
    client = get_redis_client()
    if client is None:
        return None
    try:
        value = await client.get(key)
        if value:
            logger.info(f"Cache HIT for key: {key}")
            return value
        logger.info(f"Cache MISS for key: {key}")
        return None
    except (RedisConnectionError, RedisTimeoutError) as e:
        logger.warning(f"Redis connection issue during get for key '{key}': {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error retrieving key '{key}' from Redis: {e}")
        return None

async def set_cache(key: str, value: str, ttl: int = 900) -> None:
    """
    Sets a value in Redis with a Time To Live (TTL) in seconds.
    If Redis is down or unavailable, logs a warning and continues.
    """
    client = get_redis_client()
    if client is None:
        return
    try:
        await client.set(key, value, ex=ttl)
        logger.info(f"Cache SET success for key: '{key}' with TTL: {ttl}s")
    except (RedisConnectionError, RedisTimeoutError) as e:
        logger.warning(f"Redis connection issue during set for key '{key}': {e}")
    except Exception as e:
        logger.error(f"Unexpected error setting key '{key}' in Redis: {e}")

async def close_redis() -> None:
    """
    Closes the Redis client connection if open.
    """
    global _redis_client
    if _redis_client is not None:
        try:
            await _redis_client.close()
            logger.info("Closed Redis connection.")
        except Exception as e:
            logger.warning(f"Error closing Redis client: {e}")
        finally:
            _redis_client = None
