from fastmcp import FastMCP
from scraper import search_instamart, get_product_details as scrape_product_details
from cache import get_cached, set_cache

mcp = FastMCP("InstaMART Agent Tools")

@mcp.tool()
async def search_product(query: str, city: str = "Mumbai") -> str:
    """Search for a grocery product on InstaMART by name.
    Returns a list of matching products with price and quantity."""
    
    cache_key = f"search:{query.lower()}:{city.lower()}"
    cached = await get_cached(cache_key)
    if cached:
        return cached
    
    results = await search_instamart(query, city)
    result_str = format_products(results)
    await set_cache(cache_key, result_str, ttl=900)  # 15 min
    return result_str

@mcp.tool()
async def get_product_details(product_url: str) -> str:
    """Get detailed info for a specific InstaMART product URL."""
    cache_key = f"detail:{product_url.lower()}"
    cached = await get_cached(cache_key)
    if cached:
        return cached
        
    details = await scrape_product_details(product_url)
    await set_cache(cache_key, details, ttl=3600)  # 1 hour
    return details

@mcp.tool()
async def list_categories() -> str:
    """List available grocery categories on InstaMART."""
    return "Fruits & Vegetables, Dairy & Eggs, Snacks, Beverages, Household, Personal Care, Bakery, Meat & Seafood"

def format_products(products: list) -> str:
    if not products:
        return "No products found."
    lines = []
    for i, p in enumerate(products, 1):
        lines.append(f"{i}. {p['name']} | {p['price']} | {p['quantity']}")
        # lines.append(f"{i}. {p['name']} | {p['price']} | {p['quantity']} | {p.get('url', '')}")
    return "\n".join(lines)

if __name__ == "__main__":
    mcp.run(transport="stdio")