from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseScraper(ABC):
    @property
    @abstractmethod
    def platform_name(self) -> str:
        """The formal name of the platform (e.g. 'Instamart', 'Zepto', 'Blinkit')."""
        pass

    @property
    @abstractmethod
    def cache_prefix(self) -> str:
        """The prefix used for caching results in Redis (e.g. 'search', 'zepto', 'blinkit')."""
        pass

    @abstractmethod
    async def search(self, query: str, city: str) -> List[Dict[str, Any]]:
        """
        Scrapes the platform for the query in the given city.
        Returns a list of dictionaries with standard keys:
        - name: str
        - price: Union[str, float, int]
        - quantity: str
        - image: Optional[str]
        - url: Optional[str]
        """
        pass
