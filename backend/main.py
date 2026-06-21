import logging
from contextlib import asynccontextmanager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger(__name__)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import run_agent, get_mcp_manager
from cache import get_cached, set_cache, close_redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Pre-initialize the persistent MCP client connection
    logger.info("Starting up SmartBuy backend server...")
    manager = get_mcp_manager()
    try:
        await manager.start()
    except Exception as e:
        logger.error(f"Failed to pre-warm MCP client manager on startup: {e}")
    
    yield
    
    # Shutdown: Clean up persistent browser and Redis connections
    logger.info("Shutting down SmartBuy backend server...")
    try:
        await manager.stop()
    except Exception as e:
        logger.error(f"Error during MCP client shutdown: {e}")
        
    try:
        await close_redis()
    except Exception as e:
        logger.error(f"Error closing Redis connection: {e}")

app = FastAPI(title="SmartBuy AI Agent API", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=["*"],
  allow_methods=["*"], allow_headers=["*"])

class SearchRequest(BaseModel):
    query: str
    city: str = "Mumbai"

class SearchResponse(BaseModel):
    result: str
    products: list[dict] = []

@app.post("/search", response_model=SearchResponse)
async def search_products(req: SearchRequest):
    cache_key = f"api_search:{req.query.lower().strip()}:{req.city.lower().strip()}"
    try:
        cached_val = await get_cached(cache_key)
        if cached_val:
            logger.info(f"API Cache HIT for key: {cache_key}")
            return SearchResponse(result=cached_val)
    except Exception as e:
        logger.warning(f"Failed to check API cache: {e}")

    logger.info(f"API Cache MISS for key: {cache_key}. Running agent...")
    result = await run_agent(f"Search for '{req.query}' on InstaMART in {req.city}")
    
    # Only cache successful/non-error responses
    if "Sorry, I encountered an issue" not in result and "RESOURCE_EXHAUSTED" not in result:
        try:
            await set_cache(cache_key, result, ttl=900)  # 15 min
            logger.info(f"API Cache SET for key: {cache_key}")
        except Exception as e:
            logger.warning(f"Failed to set API cache: {e}")

    return SearchResponse(result=result)

@app.get("/health")
async def health():
    return {"status": "ok"}