import logging
from .server import mcp
from platforms import (
    search_all_platforms as run_search_all_platforms,
    InstamartScraper,
    ZeptoScraper,
    BlinkitScraper,
    run_platform_search
)

logger = logging.getLogger(__name__)

@mcp.tool()
async def search_instamart(query: str, city: str = "Mumbai") -> str:
    """Search for a grocery product on InstaMART by name.
    Returns a list of matching products with price and quantity."""
    return await run_platform_search(InstamartScraper(), query, city)

@mcp.tool()
async def search_zepto(query: str, city: str = "Mumbai") -> str:
    """Search Zepto for products using Apify scraper. Returns formatted product list."""
    return await run_platform_search(ZeptoScraper(), query, city)

@mcp.tool()
async def search_blinkit(query: str, city: str = "Mumbai") -> str:
    """Search Blinkit for products using Apify scraper. Returns formatted product list."""
    return await run_platform_search(BlinkitScraper(), query, city)

@mcp.tool()
async def search_all_platforms(query: str, city: str = "Mumbai") -> str:
    """Search Instamart, Zepto, and Blinkit simultaneously and return all 
    three platform sections in one formatted response."""
    return await run_search_all_platforms(query, city)

@mcp.tool()
async def list_categories() -> str:
    """List available grocery categories on InstaMART."""
    return "Fruits & Vegetables, Dairy & Eggs, Snacks, Beverages, Household, Personal Care, Bakery, Meat & Seafood"
