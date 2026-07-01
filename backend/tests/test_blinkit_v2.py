import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

async def test():
    apify_token = os.getenv("APIFY_TOKEN")
    url = f"https://api.apify.com/v2/acts/krazee_kaushik~blinkit-product-results-scraper/run-sync-get-dataset-items?token={apify_token}"
    
    # Try Zepto-like schema
    body = {
        "searchQueries": ["milk"],
        "locations": ["Mumbai"]
    }
    
    print("Testing Zepto-like schema...")
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, json=body)
        print("Status Code:", response.status_code)
        try:
            print("Response:", response.json()[:2]) # print first 2 items
        except Exception:
            print("Response text:", response.text[:500])

if __name__ == "__main__":
    asyncio.run(test())
