import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger(__name__)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import run_agent
from cache import get_cached, set_cache

app = FastAPI(title="InstaMART AI Agent API")

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