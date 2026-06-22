import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger(__name__)

import httpx
import os
import asyncio
import urllib.parse
from fastmcp import FastMCP
from scraper import search_instamart, get_product_details as scrape_product_details
from cache import get_cached, set_cache

mcp = FastMCP("SmartBuy Agent Tools")

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
async def search_zepto(query: str, city: str = "Mumbai") -> str:
    """Search Zepto for products using Apify scraper. Returns formatted product list."""
    
    apify_token = os.getenv("APIFY_TOKEN")
    if not apify_token:
        logger.error("APIFY_TOKEN env variable is missing.")
        return "Zepto search is currently unavailable (missing API token)."

    cache_key = f"zepto:{query.lower()}:{city.lower()}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    url = f"https://api.apify.com/v2/acts/krazee_kaushik~zepto-scraper/run-sync-get-dataset-items?token={apify_token}"
    body = {
        "searchQueries": [query],
        "locations": [city]
    }
    
    retries = 3
    backoff = 2.0
    
    for attempt in range(retries):
        try:
            logger.info(f"Calling Apify Zepto scraper (Attempt {attempt+1}/{retries})...")
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(url, json=body)
                
                if response.status_code in (200, 201):
                    try:
                        products = response.json()
                    except Exception as json_err:
                        logger.error(f"Failed to parse Apify JSON response: {json_err}")
                        raise json_err

                    if isinstance(products, list):
                        valid_products = []
                        for p in products:
                            name = p.get("name")
                            if name:
                                price = p.get("price", "N/A")
                                quantity = p.get("formatted_packsize") or p.get("pack_size") or p.get("quantity") or "N/A"
                                
                                img = None
                                images_list = p.get("images")
                                if images_list and isinstance(images_list, list) and len(images_list) > 0:
                                    img_path = images_list[0]
                                    if img_path.startswith("http"):
                                        img = img_path
                                    else:
                                        img = f"https://cdn.zeptonow.com/{img_path.lstrip('/')}"
                                elif p.get("image"):
                                    img = p.get("image")
                                
                                if img and "images.zeptonow.com" in img:
                                    img = img.replace("images.zeptonow.com", "cdn.zeptonow.com")
                                
                                prod_url = p.get("url") or f"https://www.zeptonow.com/search?query={urllib.parse.quote(name)}"
                                valid_products.append({
                                    "name": name,
                                    "price": price,
                                    "quantity": quantity,
                                    "image": img,
                                    "url": prod_url
                                })
                        
                        result_str = format_products(valid_products)
                        await set_cache(cache_key, result_str, ttl=900)  # 15 min
                        logger.info(f"Zepto scraping succeeded: {len(valid_products)} items found.")
                        return result_str
                    else:
                        logger.warning(f"Apify response was not a list: {products}")
                        raise ValueError("Invalid response format from Apify")
                else:
                    logger.error(f"Apify returned status code {response.status_code}: {response.text}")
                    raise httpx.HTTPStatusError(f"HTTP Error {response.status_code}", request=response.request, response=response)
                    
        except Exception as e:
            logger.error(f"Error calling Apify Zepto scraper on attempt {attempt+1}: {e}")
            if attempt < retries - 1:
                sleep_time = backoff * (2 ** attempt)
                logger.info(f"Retrying in {sleep_time} seconds...")
                await asyncio.sleep(sleep_time)
            else:
                logger.error("All Apify Zepto scraper retry attempts exhausted.")
                
    return "Zepto search is currently unavailable."

@mcp.tool()
async def search_blinkit(query: str, city: str = "Mumbai") -> str:
    """Search Blinkit for products using Apify scraper. Returns formatted product list."""
    
    apify_token = os.getenv("APIFY_TOKEN")
    if not apify_token:
        logger.error("APIFY_TOKEN env variable is missing.")
        return "BLINKIT_UNAVAILABLE"

    cache_key = f"blinkit:{query.lower()}:{city.lower()}"
    cached = await get_cached(cache_key)
    if cached:
        return cached

    url = f"https://api.apify.com/v2/acts/krazee_kaushik~blinkit-product-results-scraper/run-sync-get-dataset-items?token={apify_token}"
    body = {
        "searchQueries": [query],
        "locations": [city]
    }
    
    retries = 3
    backoff = 2.0
    
    for attempt in range(retries):
        try:
            logger.info(f"Calling Apify Blinkit scraper (Attempt {attempt+1}/{retries})...")
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(url, json=body)
                
                if response.status_code in (200, 201):
                    try:
                        products = response.json()
                    except Exception as json_err:
                        logger.error(f"Failed to parse Apify JSON response: {json_err}")
                        raise json_err

                    if isinstance(products, list):
                        valid_products = []
                        for p in products:
                            name = p.get("name") or p.get("title")
                            if name:
                                price = p.get("price") or p.get("price_discount") or p.get("price_regular") or "N/A"
                                quantity = p.get("formatted_packsize") or p.get("pack_size") or p.get("quantity") or p.get("variant") or p.get("unit") or "N/A"
                                
                                img = p.get("image") or p.get("primary_image")
                                images_list = p.get("images")
                                if not img and images_list and isinstance(images_list, list) and len(images_list) > 0:
                                    img = images_list[0]
                                
                                prod_url = p.get("url") or f"https://blinkit.com/s/?q={urllib.parse.quote(name)}"
                                valid_products.append({
                                    "name": name,
                                    "price": price,
                                    "quantity": quantity,
                                    "image": img,
                                    "url": prod_url
                                })
                        
                        result_str = format_products(valid_products)
                        await set_cache(cache_key, result_str, ttl=900)  # 15 min
                        logger.info(f"Blinkit scraping succeeded: {len(valid_products)} items found.")
                        return result_str
                    else:
                        logger.warning(f"Apify response was not a list: {products}")
                        raise ValueError("Invalid response format from Apify")
                else:
                    logger.error(f"Apify returned status code {response.status_code}: {response.text}")
                    raise httpx.HTTPStatusError(f"HTTP Error {response.status_code}", request=response.request, response=response)
                    
        except Exception as e:
            logger.error(f"Error calling Apify Blinkit scraper on attempt {attempt+1}: {e}")
            if attempt < retries - 1:
                sleep_time = backoff * (2 ** attempt)
                logger.info(f"Retrying in {sleep_time} seconds...")
                await asyncio.sleep(sleep_time)
            else:
                logger.error("All Apify Blinkit scraper retry attempts exhausted.")
                
    return "BLINKIT_UNAVAILABLE"

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

if __name__ == "__main__":
    mcp.run(transport="stdio")