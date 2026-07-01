import asyncio
import logging
import urllib.parse
from typing import List, Dict, Any
from .base import BaseScraper
from utils.browser import (
    BrowserManager, 
    create_stealth_page, 
    random_delay, 
    handle_location_modal, 
    INSTAMART_BASE
)

logger = logging.getLogger(__name__)

class InstamartScraper(BaseScraper):
    @property
    def platform_name(self) -> str:
        return "InstaMART"

    @property
    def cache_prefix(self) -> str:
        return "search"

    async def search(self, query: str, city: str = "Mumbai") -> List[Dict[str, Any]]:
        """
        Search for products on Swiggy Instamart.
        Includes customized anti-bot measures, location selection, and fallback selectors.
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
                logger.info(f"Retrying Instamart in {sleep_time} seconds...")
                await asyncio.sleep(sleep_time)
            else:
                logger.error("All scraper retry attempts exhausted.")
                    
        return []
