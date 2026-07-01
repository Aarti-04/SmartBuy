import urllib.parse
from typing import List, Dict, Any
from .base_apify import BaseApifyScraper

class BlinkitScraper(BaseApifyScraper):
    @property
    def actor_id(self) -> str:
        return "krazee_kaushik/blinkit-product-results-scraper"

    @property
    def platform_name(self) -> str:
        return "Blinkit"

    @property
    def cache_prefix(self) -> str:
        return "blinkit"

    def _parse_products(self, raw_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        valid_products = []
        for p in raw_products:
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
        return valid_products
