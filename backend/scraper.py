import json
import asyncio
import random
import logging
import urllib.parse
import atexit
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

class BrowserManager:
    _playwright = None
    _browser = None
    _lock = asyncio.Lock()

    @classmethod
    async def get_browser(cls):
        async with cls._lock:
            if cls._browser is None or not cls._browser.is_connected():
                if cls._browser:
                    try:
                        await cls._browser.close()
                    except Exception:
                        pass
                    cls._browser = None
                
                if cls._playwright is None:
                    cls._playwright = await async_playwright().start()
                
                logger.info("Launching a new Playwright Chromium instance...")
                cls._browser = await cls._playwright.chromium.launch(
                    headless=True,
                    args=["--disable-blink-features=AutomationControlled"]
                )
                logger.info("Playwright Chromium instance launched.")
            return cls._browser

    @classmethod
    async def close_browser(cls):
        async with cls._lock:
            if cls._browser:
                logger.info("Closing Playwright Chromium instance...")
                try:
                    await cls._browser.close()
                except Exception as e:
                    logger.warning(f"Error closing browser: {e}")
                cls._browser = None
            if cls._playwright:
                try:
                    await cls._playwright.stop()
                except Exception as e:
                    logger.warning(f"Error stopping playwright: {e}")
                cls._playwright = None
            logger.info("Playwright Chromium instance stopped.")

def cleanup_browser():
    if BrowserManager._browser:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(BrowserManager.close_browser())
            else:
                loop.run_until_complete(BrowserManager.close_browser())
        except Exception:
            pass

atexit.register(cleanup_browser)

async def create_stealth_page(browser, user_agent: Optional[str] = None) -> tuple[BrowserContext, Page]:
    """
    Creates a new browser context and page with randomized User Agent and stealth settings.
    """
    ua = user_agent or random.choice(USER_AGENTS)
    context = await browser.new_context(
        user_agent=ua,
        viewport={"width": 1280, "height": 800},
        extra_http_headers={
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        }
    )
    page = await context.new_page()
    
    stealth = Stealth(
        chrome_app=False,
        chrome_csi=False,
        chrome_load_times=False
    )
    await stealth.apply_stealth_async(page)
    return context, page

async def random_delay(min_s: float = 2.0, max_s: float = 5.0) -> None:
    """Sleep for a randomized duration to mimic human behavior."""
    delay = random.uniform(min_s, max_s)
    await asyncio.sleep(delay)

async def handle_location_modal(page: Page, city: str) -> None:
    """
    Attempts to locate and fill out the delivery location selector on Swiggy.
    """
    try:
        combined_sel = (
            "input[placeholder*='location'], "
            "input[placeholder*='Search for area'], "
            "input[placeholder*='address'], "
            "input[placeholder*='delivery'], "
            ".LocationSelection_input, "
            "div[class*='location'] input"
        )
        
        try:
            location_input = await page.wait_for_selector(combined_sel, timeout=2000)
        except Exception:
            location_input = None

        if location_input:
            logger.info(f"Setting delivery location to: {city}")
            await location_input.click()
            await random_delay(0.5, 1.5)
            await location_input.fill(city)
            await random_delay(1.5, 3.0) # Wait for suggestions to render
            
            combined_sug = (
                "div[class*='suggestion'], "
                ".LocationSelection_suggestion, "
                "button[class*='suggestion'], "
                "div[class*='address'], "
                "span[class*='location']"
            )
            try:
                await page.wait_for_selector(combined_sug, timeout=4000)
                suggestions = await page.locator(combined_sug).all()
                if suggestions:
                    await suggestions[0].click()
                    logger.info("Successfully clicked location suggestion.")
                    await random_delay(2.0, 3.5) # Wait for session redirect
                    return
            except Exception as sug_err:
                logger.warning(f"Failed to configure location suggestion: {sug_err}")
    except Exception as e:
        logger.warning(f"Did not configure location modal: {e}. Moving on.")

async def search_instamart(query: str, city: str = "Mumbai") -> List[Dict[str, Any]]:
    """
    Search for products on Swiggy Instamart.
    Includes customized anti-bot measures (Stealth config), location selection, and fallback selectors.
    """
    retries = 2
    backoff = 2.0
    
    for attempt in range(retries):
        context = None
        page = None
        try:
            async def run_attempt():
                nonlocal context, page
                browser = await BrowserManager.get_browser()
                context, page = await create_stealth_page(browser)
                
                logger.info(f"Opening Swiggy homepage (Attempt {attempt+1}/{retries})...")
                await page.goto(INSTAMART_BASE, wait_until="domcontentloaded", timeout=15000)
                await random_delay(1.0, 2.5)
                
                # Configure the location modal if visible
                await handle_location_modal(page, city)
                
                # Navigate to Instamart Search
                search_url = f"{INSTAMART_BASE}/search?query={urllib.parse.quote(query)}"
                logger.info(f"Searching for products via: {search_url}")
                await page.goto(search_url, wait_until="domcontentloaded", timeout=15000)
                await random_delay(1.5, 3.0)
                
                # Combined check for standard and fallback selectors in parallel with 6s timeout
                combined_card_sel = '[data-testid="item-collection-card-full"], div[class*="_3Rr1X"], div[class*="ProductCard"]'
                try:
                    await page.wait_for_selector(combined_card_sel, timeout=6000)
                except Exception as e:
                    logger.warning("Product card selectors not found. Skipping evaluate and retrying...")
                    raise e
                
                # Extract structured information from the page DOM
                products = await page.evaluate("""
                () => {
                    // Helper to find text by selector list in an element or its ancestors/descendants
                    const findText = (el, selectors) => {
                        for (const sel of selectors) {
                            const found = el.querySelector(sel);
                            if (found && found.innerText.trim()) {
                                return found.innerText.trim();
                            }
                        }
                        if (el.parentElement) {
                            for (const sel of selectors) {
                                const found = el.parentElement.querySelector(sel);
                                if (found && found.innerText.trim()) {
                                    return found.innerText.trim();
                                }
                            }
                        }
                        return null;
                    };

                    // Try finding cards by stable testid first
                    let cards = document.querySelectorAll('[data-testid="item-collection-card-full"]');
                    let isDirectCard = true;
                    
                    if (cards.length === 0) {
                        // Fallback to parent container
                        cards = document.querySelectorAll('div._3Rr1X');
                        isDirectCard = false;
                    }
                    if (cards.length === 0) {
                        // Fallback to class containing ProductCard
                        cards = document.querySelectorAll("div[class*='ProductCard']");
                        isDirectCard = false;
                    }

                    return Array.from(cards).slice(0, 10).map(item => {
                        let card = item;
                        let container = item;
                        
                        if (isDirectCard) {
                            container = item.closest('div._3Rr1X') || item.parentElement || item;
                        } else {
                            card = item.querySelector('[data-testid="item-collection-card-full"]') || item;
                        }

                        // Selectors list
                        const nameSelectors = ['div[class*="dNVSmW"]', 'div.sc-gEvEer:nth-child(3)', 'div[class*="name"]', 'div'];
                        const descSelectors = ['div[class*="qCfSW"]', 'div.sc-gEvEer:nth-child(4)', 'div[class*="description"]', 'div[class*="desc"]'];
                        const qtySelectors = ['div[class*="bCqPoH"]', 'div[class*="_3wq_F"]', 'div[class*="qty"]', 'div[class*="quantity"]', 'div[class*="weight"]'];
                        const priceSelectors = ['div[class*="iQcBUp"]', 'div[class*="_2jn41"]', 'span[class*="price"]', 'div[class*="price"]'];

                        const name = findText(card, nameSelectors) || "Unknown Product";
                        const description = findText(card, descSelectors) || "";
                        const price = findText(container, priceSelectors) || findText(card, priceSelectors) || "N/A";
                        const quantity = findText(container, qtySelectors) || findText(card, qtySelectors) || "N/A";
                        const imgEl = card.querySelector('img');
                        
                        return {
                            name: name,
                            price: price,
                            quantity: quantity,
                            description: description,
                            image: imgEl ? imgEl.src : null,
                            url: `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(name)}`
                        };
                    });
                }
                """)
                return products

            products = await asyncio.wait_for(run_attempt(), timeout=12.0)
            
            valid_products = [p for p in products if p.get('name')]
            if valid_products:
                logger.info(f"Scraped {len(valid_products)} products successfully.")
                return valid_products
            else:
                logger.warning("Scrape completed, but 0 valid products extracted.")
                
        except asyncio.TimeoutError as te:
            logger.error(f"Scrape attempt {attempt+1} timed out (12s overall limit exceeded): {te}")
        except Exception as e:
            logger.error(f"Error on scrape attempt {attempt+1}: {e}")
        finally:
            if page:
                try:
                    await page.close()
                except Exception:
                    pass
            if context:
                try:
                    await context.close()
                except Exception:
                    pass
                
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
    context = None
    page = None
    try:
        browser = await BrowserManager.get_browser()
        context, page = await create_stealth_page(browser)
        
        logger.info(f"Navigating to product details: {product_url}")
        await page.goto(product_url, wait_until="domcontentloaded", timeout=15000)
        await random_delay(1.5, 3.0)
        
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
        
        return f"Product Name: {details['name']}\nPrice: {details['price']}\nQuantity: {details['quantity']}\nDescription: {details['description']}"
        
    except Exception as e:
        logger.error(f"Error scraping product details: {e}")
        return f"Failed to retrieve product details from {product_url}. Error: {str(e)}"
    finally:
        if page:
            try:
                await page.close()
            except Exception:
                pass
        if context:
            try:
                await context.close()
            except Exception:
                pass

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
