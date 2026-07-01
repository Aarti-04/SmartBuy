import asyncio
import random
import logging
import atexit
from typing import Optional
from playwright.async_api import async_playwright, Page, BrowserContext
from playwright_stealth import Stealth

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
