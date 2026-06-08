import os
import json
import asyncio
import random
import logging
import urllib.parse
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright, Page, BrowserContext
from playwright_stealth import Stealth

# Setup logging
logger = logging.getLogger(__name__)

INSTAMART_BASE = "https://www.swiggy.com/instamart"

# Rotate User Agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0"
]

async def random_delay(min_s: float = 2.0, max_s: float = 5.0) -> None:
    """Sleep for a randomized duration to mimic human behavior."""
    delay = random.uniform(min_s, max_s)
    await asyncio.sleep(delay)

async def handle_location_modal(page: Page, city: str) -> None:
    """
    Attempts to locate and fill out the delivery location selector on Swiggy.
    """
    try:
        # Selectors commonly matching the location modal or trigger
        selectors = [
            "input[placeholder*='location']",
            "input[placeholder*='Search for area']",
            "input[placeholder*='address']",
            "input[placeholder*='delivery']",
            ".LocationSelection_input",
            "div[class*='location'] input"
        ]
        
        location_input = None
        for sel in selectors:
            try:
                el = await page.wait_for_selector(sel, timeout=3000)
                if el:
                    location_input = el
                    break
            except Exception:
                continue

        if location_input:
            logger.info(f"Setting delivery location to: {city}")
            await location_input.click()
            await random_delay(0.5, 1.5)
            await location_input.fill(city)
            await random_delay(1.5, 3.0) # Wait for suggestions to render
            
            # Click the first autocomplete option
            suggestion_selectors = [
                "div[class*='suggestion']",
                ".LocationSelection_suggestion",
                "button[class*='suggestion']",
                "div[class*='address']",
                "span[class*='location']"
            ]
            for sug_sel in suggestion_selectors:
                try:
                    suggestions = await page.locator(sug_sel).all()
                    if suggestions:
                        await suggestions[0].click()
                        logger.info("Successfully clicked location suggestion.")
                        await random_delay(2.0, 4.0) # Wait for session redirect
                        return
                except Exception:
                    continue
    except Exception as e:
        logger.warning(f"Did not configure location modal: {e}. Moving on.")

async def search_instamart(query: str, city: str = "Mumbai") -> List[Dict[str, Any]]:
    """
    Search for products on Swiggy Instamart.
    Includes customized anti-bot measures (Stealth config), location selection, and fallback selectors.
    """
    retries = 3
    backoff = 2.0
    
    for attempt in range(retries):
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=["--disable-blink-features=AutomationControlled"]
                )
                
                user_agent = random.choice(USER_AGENTS)
                context = await browser.new_context(
                    user_agent=user_agent,
                    viewport={"width": 1280, "height": 800},
                    extra_http_headers={
                        "Accept-Language": "en-US,en;q=0.9",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    }
                )
                
                page = await context.new_page()
                
                # Apply Stealth while disabling features that crash modern React boundary elements
                stealth = Stealth(
                    chrome_app=False,
                    chrome_csi=False,
                    chrome_load_times=False
                )
                await stealth.apply_stealth_async(page)
                
                logger.info(f"Opening Swiggy homepage (Attempt {attempt+1}/{retries})...")
                await page.goto(INSTAMART_BASE, wait_until="domcontentloaded", timeout=30000)
                await random_delay(1.0, 2.5)
                
                # Configure the location modal if visible
                await handle_location_modal(page, city)
                
                # Navigate to Instamart Search
                search_url = f"{INSTAMART_BASE}/search?query={query}"
                logger.info(f"Searching for products via: {search_url}")
                await page.goto(search_url, wait_until="networkidle", timeout=30000)
                await random_delay(2.0, 4.0)
                
                # Wait for product card container or item card test ID
                try:
                    await page.wait_for_selector('[data-testid="item-collection-card-full"]', timeout=10000)
                except Exception:
                    logger.warning("Standard card test ID not found. Waiting for class container...")
                    await page.wait_for_selector("div[class*='_3Rr1X']", timeout=5000)
                
                # Extract structured information from the page DOM
                products = await page.evaluate("""
                () => {
                    // Try to locate parent containers first
                    let containers = document.querySelectorAll('div._3Rr1X');
                    if (containers.length === 0) {
                        // Fallback to cards directly
                        let cards = document.querySelectorAll('[data-testid="item-collection-card-full"]');
                        if (cards.length === 0) {
                            cards = document.querySelectorAll("div[class*='ProductCard']");
                        }
                        return Array.from(cards).slice(0, 10).map(card => {
                            const nameEl = card.querySelector('div[class*="dNVSmW"]') || card.querySelector('div.sc-gEvEer:nth-child(3)') || card.querySelector('div');
                            const descEl = card.querySelector('div[class*="qCfSW"]') || card.querySelector('div.sc-gEvEer:nth-child(4)');
                            const name = nameEl ? nameEl.innerText.trim() : "";
                            return {
                                name: name,
                                price: "N/A",
                                quantity: "N/A",
                                description: descEl ? descEl.innerText.trim() : "",
                                image: card.querySelector('img')?.src || null,
                                url: `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(name)}`
                            };
                        });
                    }
                    
                    return Array.from(containers).slice(0, 10).map(container => {
                        const card = container.querySelector('[data-testid="item-collection-card-full"]');
                        if (!card) return null;
                        
                        // Extract name, description, image
                        const nameEl = card.querySelector('div[class*="dNVSmW"]') || card.querySelector('div.sc-gEvEer:nth-child(3)');
                        const descEl = card.querySelector('div[class*="qCfSW"]') || card.querySelector('div.sc-gEvEer:nth-child(4)');
                        const imgEl = card.querySelector('img');
                        
                        // Extract quantity, price from parent container _3dcA8
                        const qtyEl = container.querySelector('div[class*="bCqPoH"]') || container.querySelector('div[class*="_3wq_F"]');
                        const priceEl = container.querySelector('div[class*="iQcBUp"]') || container.querySelector('div[class*="_2jn41"]');
                        
                        const name = nameEl ? nameEl.innerText.trim() : "Unknown Product";
                        const price = priceEl ? priceEl.innerText.trim() : "N/A";
                        const quantity = qtyEl ? qtyEl.innerText.trim() : "N/A";
                        const description = descEl ? descEl.innerText.trim() : "";
                        
                        return {
                            name: name,
                            price: price,
                            quantity: quantity,
                            description: description,
                            image: imgEl ? imgEl.src : null,
                            url: `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(name)}`
                        };
                    }).filter(Boolean);
                }
                """)
                
                await browser.close()
                
                valid_products = [p for p in products if p.get('name')]
                if valid_products:
                    logger.info(f"Scraped {len(valid_products)} products successfully.")
                    return valid_products
                else:
                    logger.warning("Scrape completed, but 0 valid products extracted.")
                    
        except Exception as e:
            logger.error(f"Error on scrape attempt {attempt+1}: {e}")
            if attempt < retries - 1:
                sleep_time = backoff * (2 ** attempt)
                logger.info(f"Retrying in {sleep_time} seconds...")
                await asyncio.sleep(sleep_time)
            else:
                logger.error("All scraper retry attempts exhausted.")
                
    return []

async def get_product_details(product_url: str) -> str:
    """
    Retrieves details for a single product. 
    If the product URL is a search redirect, resolves details via search parsing.
    """
    parsed_url = urllib.parse.urlparse(product_url)
    params = urllib.parse.parse_qs(parsed_url.query)
    
    # If the URL is constructed as search redirect, run search to obtain details
    if "query" in params:
        query = params["query"][0]
        logger.info(f"Resolving product details via search query fallback: {query}")
        results = await search_instamart(query)
        if results:
            item = results[0]
            return f"Product Name: {item['name']}\nPrice: {item['price']}\nQuantity: {item['quantity']}\nDescription: {item['description'] or 'No description'}"
        return f"No details found for product search query: '{query}'."

    # Direct URL scraping fallback
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"]
            )
            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={"width": 1280, "height": 800}
            )
            page = await context.new_page()
            
            stealth = Stealth(
                chrome_app=False,
                chrome_csi=False,
                chrome_load_times=False
            )
            await stealth.apply_stealth_async(page)
            
            logger.info(f"Navigating to product details: {product_url}")
            await page.goto(product_url, wait_until="networkidle", timeout=30000)
            await random_delay(2.0, 4.0)
            
            details = await page.evaluate("""
            () => {
                const titleEl = document.querySelector('h1') || document.querySelector('[class*="title"]') || document.querySelector('[class*="Title"]');
                const priceEl = document.querySelector('[class*="price"]') || document.querySelector('[class*="Price"]');
                const quantityEl = document.querySelector('[class*="quantity"]') || document.querySelector('[class*="weight"]');
                
                const descElements = document.querySelectorAll('[class*="description"], [class*="detail"], [class*="about"]');
                let descText = "";
                descElements.forEach(el => {
                    if (el.innerText.trim().length > descText.length) {
                        descText = el.innerText.trim();
                    }
                });
                
                return {
                    name: titleEl ? titleEl.innerText.trim() : "Unknown Product",
                    price: priceEl ? priceEl.innerText.trim() : "Unknown Price",
                    quantity: quantityEl ? quantityEl.innerText.trim() : "N/A",
                    description: descText || "No description provided."
                };
            }
            """)
            
            await browser.close()
            return f"Product Name: {details['name']}\nPrice: {details['price']}\nQuantity: {details['quantity']}\nDescription: {details['description']}"
            
    except Exception as e:
        logger.error(f"Error scraping product details: {e}")
        return f"Failed to retrieve product details from {product_url}. Error: {str(e)}"

if __name__ == "__main__":
    async def main() -> None:
        logging.basicConfig(level=logging.INFO)
        print("Testing search_instamart...")
        prods = await search_instamart("milk", "Mumbai")
        print("Found products:")
        print(json.dumps(prods, indent=2))
        
        if prods:
            print("\nTesting get_product_details...")
            details = await get_product_details(prods[0]['url'])
            print(details)
            
    asyncio.run(main())
