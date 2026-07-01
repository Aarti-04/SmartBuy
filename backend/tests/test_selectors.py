# test_selectors.py
import asyncio
import sys
import logging
from platforms.instamart import InstamartScraper

# Configure basic logging to see step output
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("SelectorMonitor")

async def run_monitoring_test() -> None:
    logger.info("Starting weekly selector monitoring check for Swiggy Instamart...")
    test_query = "milk"
    test_city = "Mumbai"
    
    # 1. Test search scraper
    logger.info(f"Testing search_instamart with query: '{test_query}' in '{test_city}'...")
    try:
        scraper = InstamartScraper()
        products = await scraper.search(test_query, test_city)
        if not products:
            logger.error("CRITICAL: search_instamart returned 0 products. Selectors might be broken!")
            sys.exit(1)
            
        logger.info(f"Successfully scraped {len(products)} products.")
        
        # Validate the structure of the first product
        sample = products[0]
        logger.info(f"Sample product scraped: {sample}")
        
        required_keys = ["name", "price", "quantity", "url"]
        for key in required_keys:
            if key not in sample:
                logger.error(f"CRITICAL: Scraped product missing required key '{key}'!")
                sys.exit(1)
            if not sample[key]:
                logger.warning(f"Warning: Scraped product has empty/null value for key '{key}': {sample[key]}")
        
        logger.info("Search selectors validation: PASSED")
        
        logger.info("Weekly Selector Monitoring Test: ALL PASSED")
        sys.exit(0)
        
    except Exception as e:
        logger.exception(f"CRITICAL: Selector monitoring test failed with exception: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_monitoring_test())
