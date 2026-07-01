import asyncio
import logging
from .instamart import InstamartScraper
from .zepto import ZeptoScraper
from .blinkit import BlinkitScraper
from .runner import run_platform_search

logger = logging.getLogger(__name__)

async def with_timeout(coro, seconds: float, label: str) -> str:
    try:
        return await asyncio.wait_for(coro, timeout=seconds)
    except asyncio.TimeoutError:
        logger.warning(f"{label} timed out after {seconds}s")
        return "⚠️ Currently unavailable for city (timed out)"
    except Exception as e:
        logger.error(f"{label} failed with error: {e}")
        return f"{label}_UNAVAILABLE"

async def search_all_platforms(query: str, city: str = "Mumbai") -> str:
    """
    Orchestrates search queries across Instamart, Zepto, and Blinkit concurrently,
    applying individual timeouts and formatting rules.
    """
    instamart_scraper = InstamartScraper()
    zepto_scraper = ZeptoScraper()
    blinkit_scraper = BlinkitScraper()
    
    results = await asyncio.gather(
        with_timeout(run_platform_search(instamart_scraper, query, city), 45.0, "INSTAMART"),
        with_timeout(run_platform_search(zepto_scraper, query, city), 45.0, "ZEPTO"),
        with_timeout(run_platform_search(blinkit_scraper, query, city), 45.0, "BLINKIT"),
        return_exceptions=True
    )
    
    labels = ["INSTAMART", "ZEPTO", "BLINKIT"]
    sections = []
    for label, result in zip(labels, results):
        if isinstance(result, BaseException):
            logger.error(f"{label} tool raised: {result}")
            sections.append(f"**{label}:**\n⚠️ Currently unavailable for {city}")
        elif not result or result in ("No products found.", "BLINKIT_UNAVAILABLE") or "unavailable" in result.lower():
            sections.append(f"**{label}:**\n⚠️ Currently unavailable for {city}")
        else:
            sections.append(f"**{label}:**\n{result}")
            
    return "\n\n".join(sections)
