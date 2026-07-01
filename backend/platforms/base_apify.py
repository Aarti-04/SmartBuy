import os
import httpx
import logging
import asyncio
from abc import abstractmethod
from typing import List, Dict, Any
from config import settings
from .base import BaseScraper

logger = logging.getLogger(__name__)

class BaseApifyScraper(BaseScraper):
    @property
    @abstractmethod
    def actor_id(self) -> str:
        """The Apify actor identifier (e.g. 'krazee_kaushik/zepto-scraper')."""
        pass

    async def search(self, query: str, city: str) -> List[Dict[str, Any]]:
        apify_token = settings.apify_token
        if not apify_token:
            logger.error(f"APIFY_TOKEN config setting is missing for {self.platform_name}.")
            return []

        url = f"https://api.apify.com/v2/acts/{self.actor_id.replace('/', '~')}/run-sync-get-dataset-items?token={apify_token}"
        body = self._get_request_body(query, city)
        
        retries = 2
        backoff = 1.5
        
        for attempt in range(retries):
            try:
                logger.info(f"Calling Apify {self.platform_name} scraper (Attempt {attempt+1}/{retries})...")
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(url, json=body)
                    
                    if response.status_code in (200, 201):
                        try:
                            products = response.json()
                        except Exception as json_err:
                            logger.error(f"Failed to parse Apify JSON response for {self.platform_name}: {json_err}")
                            raise json_err

                        if isinstance(products, list):
                            parsed = self._parse_products(products)
                            logger.info(f"{self.platform_name} scraping succeeded: {len(parsed)} items found.")
                            return parsed
                        else:
                            logger.warning(f"Apify response for {self.platform_name} was not a list: {products}")
                            raise ValueError("Invalid response format from Apify")
                    elif response.status_code in (401, 403):
                        logger.error(f"Apify returned authentication error {response.status_code} for {self.platform_name}: {response.text}")
                        return []
                    else:
                        logger.error(f"Apify returned status code {response.status_code} for {self.platform_name}: {response.text}")
                        raise httpx.HTTPStatusError(f"HTTP Error {response.status_code}", request=response.request, response=response)
                        
            except Exception as e:
                logger.error(f"Error calling Apify {self.platform_name} scraper on attempt {attempt+1}: {e}")
                if attempt < retries - 1:
                    logger.info(f"Retrying {self.platform_name} in {backoff} seconds...")
                    await asyncio.sleep(backoff)
                else:
                    logger.error(f"All Apify {self.platform_name} scraper retry attempts exhausted.")
                    
        return []

    def _get_request_body(self, query: str, city: str) -> Dict[str, Any]:
        return {
            "searchQueries": [query],
            "locations": [city]
        }

    @abstractmethod
    def _parse_products(self, raw_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        pass
