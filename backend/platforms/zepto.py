import urllib.parse
from typing import List, Dict, Any
from .base_apify import BaseApifyScraper

class ZeptoScraper(BaseApifyScraper):
    @property
    def actor_id(self) -> str:
        return "krazee_kaushik/zepto-scraper"

    @property
    def platform_name(self) -> str:
        return "Zepto"

    @property
    def cache_prefix(self) -> str:
        return "zepto"

    def _parse_products(self, raw_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        valid_products = []
        for p in raw_products:
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
        return valid_products
