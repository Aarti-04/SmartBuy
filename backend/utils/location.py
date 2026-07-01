from typing import List, Tuple
from config import settings

def normalize_city(city: str) -> str:
    """
    Normalizes the input city string by checking it against a list of supported cities and aliases.
    If the input contains any of the alias keywords (case-insensitive), returns the primary city name.
    Otherwise, extracts the last component of a comma-separated address or defaults to the stripped input.
    """
    city_lower = city.lower().strip()
    
    for city_name, aliases in settings.supported_cities:
        for alias in aliases:
            if alias in city_lower:
                return city_name
                
    if "," in city:
        return city.split(",")[-1].strip()
        
    return city.strip()
