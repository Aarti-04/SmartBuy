import logging
from typing import List, Dict, Any
from cache import get_cached, set_cache
from .base import BaseScraper

logger = logging.getLogger(__name__)

def format_products(products: List[Dict[str, Any]]) -> str:
    """
    Formats a list of product dictionaries into standard line items:
    Line format: Index. Name | Price | Quantity | URL | Image
    """
    if not products:
        return "No products found."
    lines = []
    for i, p in enumerate(products, 1):
        price = str(p.get('price', 'N/A'))
        if price != 'N/A' and not any(symbol in price for symbol in ['₹', 'Rs', 'Rs.']):
            price = f"₹{price}"
        
        url = p.get('url')
        image = p.get('image')
        if url and image:
            lines.append(f"{i}. {p['name']} | {price} | {p['quantity']} | {url} | {image}")
        elif url:
            lines.append(f"{i}. {p['name']} | {price} | {p['quantity']} | {url}")
        else:
            lines.append(f"{i}. {p['name']} | {price} | {p['quantity']}")
    return "\n".join(lines)

async def run_platform_search(scraper: BaseScraper, query: str, city: str) -> str:
    """
    Helper runner that handles:
    1. Cash lookup
    2. Scraper execution
    3. Product list formatting
    4. Caching successful formatted results
    """
    cache_key = f"{scraper.cache_prefix}:{query.lower().strip()}:{city.lower().strip()}"
    try:
        cached = await get_cached(cache_key)
        if cached:
            logger.info(f"Cache HIT for {scraper.platform_name}: {cache_key}")
            return cached
    except Exception as e:
        logger.warning(f"Failed to check cache for {scraper.platform_name}: {e}")
        
    try:
        products = await scraper.search(query, city)
        formatted = format_products(products)
        if products:
            try:
                await set_cache(cache_key, formatted, ttl=900)
            except Exception as e:
                logger.warning(f"Failed to set cache for {scraper.platform_name}: {e}")
        return formatted
    except Exception as e:
        logger.error(f"Scraper execution error on {scraper.platform_name}: {e}")
        return f"{scraper.platform_name.upper()}_UNAVAILABLE"
