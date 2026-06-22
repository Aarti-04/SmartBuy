/**
 * Generates the deep-link search URL for the given retailer platform.
 */
export function generatePlatformUrl(productName, platform) {
  const encoded = encodeURIComponent(productName.trim());
  switch (platform) {
    case 'instamart':
      return `https://www.swiggy.com/instamart/search?query=${encoded}`;
    case 'zepto':
      return `https://www.zeptonow.com/search?query=${encoded}`;
    case 'blinkit':
      return `https://blinkit.com/s/?q=${encoded}`;
    default:
      return null;
  }
}

/**
 * Parses the plain text response from the FastAPI agent.
 * Format expected: "N. Product Name | ₹Price | Quantity"
 * Example: "1. Fortune Chakki Fresh Atta | ₹51 | 1 kg"
 */
export function parseAgentResponse(text) {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split('\n');
  const products = [];
  
  // Matches optional "1. " / "1) " at the start, then "Name | ₹24 | 500 ml [ | URL [ | ImageURL ] ]"
  const regex = /^(?:\d+[\.\)]\s*)?(.+?)\s*\|\s*(?:(?:₹|Rs\.?)\s*)?([\d,.]+)\s*\|\s*(.+?)(?:\s*\|\s*(https?:\/\/\S+))?(?:\s*\|\s*(https?:\/\/\S+))?$/i;

  let currentPlatform = 'instamart';

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const upperLine = trimmed.toUpperCase();
    
    // Detect platform headers
    if (upperLine.includes('INSTAMART') && !/^\d+[\.\)]/.test(trimmed)) {
      currentPlatform = 'instamart';
      return;
    }
    if (upperLine.includes('ZEPTO') && !/^\d+[\.\)]/.test(trimmed)) {
      currentPlatform = 'zepto';
      return;
    }
    if (upperLine.includes('BLINKIT') && !/^\d+[\.\)]/.test(trimmed)) {
      currentPlatform = 'blinkit';
      return;
    }

    // Skip section contents if they represent unavailability
    if (trimmed.includes('⚠️') || trimmed.toLowerCase().includes('unavailable')) {
      return;
    }

    const match = trimmed.match(regex);
    if (match) {
      const name = match[1].trim();
      const priceVal = parseFloat(match[2].replace(/,/g, ''));
      const quantity = match[3].trim();
      const directUrl = match[4] ? match[4].trim() : null;
      const imageUrl = match[5] ? match[5].trim() : null;
      
      const category = detectCategory(name);
      const catConfig = getCategoryConfig(category);
      
      const unitPriceStr = calculateUnitPrice(priceVal, quantity);
      const platformUrl = (directUrl && directUrl.startsWith('http')) 
        ? directUrl 
        : generatePlatformUrl(name, currentPlatform);

      products.push({
        id: `prod-${index}-${name.replace(/\s+/g, '-').toLowerCase()}-${currentPlatform}`,
        name,
        price: priceVal,
        quantity,
        platform: currentPlatform,
        category,
        emoji: catConfig.emoji,
        gradient: catConfig.gradient,
        unitPrice: unitPriceStr,
        platformUrl,
        imageUrl,
        rawLine: trimmed,
        isBestPrice: false,
        platformWinner: false
      });
    }
  });

  if (products.length > 0) {
    // 1. Group products by normalized name (fuzzy match on first 3 words)
    const groups = {};
    
    const getFuzzyKey = (nameStr) => {
      return nameStr.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .join(' ');
    };

    products.forEach(p => {
      const key = getFuzzyKey(p.name) || 'other';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(p);
    });

    // 2. Process each group to find the best price and platform winner
    Object.values(groups).forEach(group => {
      const prices = group.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      const hasInstamart = group.some(p => p.platform === 'instamart');
      const hasZepto = group.some(p => p.platform === 'zepto');
      const hasBlinkit = group.some(p => p.platform === 'blinkit');
      
      const imProd = group.find(p => p.platform === 'instamart');
      const zProd = group.find(p => p.platform === 'zepto');
      const bProd = group.find(p => p.platform === 'blinkit');

      const matchedPlatformsCount = [hasInstamart, hasZepto, hasBlinkit].filter(Boolean).length;

      group.forEach(p => {
        if (imProd) {
          p.instamartPrice = imProd.price;
          p.instamartUrl = imProd.platformUrl;
          p.instamartImage = imProd.imageUrl;
        }
        if (zProd) {
          p.zeptoPrice = zProd.price;
          p.zeptoUrl = zProd.platformUrl;
          p.zeptoImage = zProd.imageUrl;
        }
        if (bProd) {
          p.blinkitPrice = bProd.price;
          p.blinkitUrl = bProd.platformUrl;
          p.blinkitImage = bProd.imageUrl;
        }

        if (p.price === minPrice) {
          p.isBestPrice = true;
          if (matchedPlatformsCount >= 2) {
            p.platformWinner = true;
          }
        } else {
          p.isBestPrice = false;
          p.platformWinner = false;
        }

        // Add savingsAmount field showing the difference vs the most expensive matched option
        if (matchedPlatformsCount >= 2) {
          p.savingsAmount = maxPrice - p.price;
        } else {
          p.savingsAmount = 0;
        }
      });
    });
  }

  return products;
}

/**
 * Auto-detects category from name keywords.
 */
function detectCategory(name) {
  const lowercaseName = name.toLowerCase();
  
  if (/\b(atta|flour|rice|dal|wheat|maida|sooji|besan|grain|lentil)\b/.test(lowercaseName)) {
    return 'grains';
  }
  if (/\b(milk|butter|cheese|paneer|curd|yoghurt|dahi|cream|lassi|buttermilk)\b/.test(lowercaseName)) {
    return 'dairy';
  }
  if (/\b(oil|ghee|mustard|olive|coconut|sunflower|soybean)\b/.test(lowercaseName)) {
    return 'oils';
  }
  if (/\b(chips|biscuit|snack|namkeen|cookie|kurkure|lays|snack|munch|chocolate|candy)\b/.test(lowercaseName)) {
    return 'snacks';
  }
  if (/\b(tea|coffee|juice|beverage|cola|soda|pepsi|sprite|fanta|coke|drink|water)\b/.test(lowercaseName)) {
    return 'beverages';
  }
  return 'grocery';
}

/**
 * Returns emoji and gradient styling based on category.
 */
function getCategoryConfig(category) {
  switch (category) {
    case 'grains':
      return {
        emoji: '🌾',
        gradient: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)' // Amber/gold
      };
    case 'dairy':
      return {
        emoji: '🥛',
        gradient: 'linear-gradient(135deg, #E0F2FE 0%, #3B82F6 100%)' // Blue/white
      };
    case 'oils':
      return {
        emoji: '🫙',
        gradient: 'linear-gradient(135deg, #FEF3C7 0%, #D97706 100%)' // Golden
      };
    case 'snacks':
      return {
        emoji: '🍟',
        gradient: 'linear-gradient(135deg, #FFEDD5 0%, #EA580C 100%)' // Orange/brown
      };
    case 'beverages':
      return {
        emoji: '🥤',
        gradient: 'linear-gradient(135deg, #FCE7F3 0%, #EC4899 100%)' // Pink/magenta
      };
    case 'grocery':
    default:
      return {
        emoji: '🛒',
        gradient: 'linear-gradient(135deg, #D1FAE5 0%, #10B981 100%)' // Green/emerald
      };
  }
}

/**
 * Calculates per unit price (e.g. ₹51/kg, ₹120/l).
 */
function calculateUnitPrice(price, quantity) {
  // Try to match numbers and units: e.g. "500 ml", "1 kg", "2.5 ltr", "12 pcs"
  const qMatch = quantity.match(/^([\d.]+)\s*([a-zA-Z]+)/);
  if (!qMatch) return `₹${price}/${quantity}`;

  const num = parseFloat(qMatch[1]);
  const unit = qMatch[2].toLowerCase();

  if (isNaN(num) || num === 0) return `₹${price}/${quantity}`;

  // Unit conversions for common quick-commerce terms
  if (unit === 'g' || unit === 'gm') {
    const kgVal = num / 1000;
    return `₹${Math.round(price / kgVal)}/kg`;
  }
  if (unit === 'ml') {
    const lVal = num / 1000;
    return `₹${Math.round(price / lVal)}/l`;
  }
  if (unit === 'kg') {
    return `₹${Math.round(price / num)}/kg`;
  }
  if (unit === 'l' || unit === 'ltr' || unit === 'liter' || unit === 'litre') {
    return `₹${Math.round(price / num)}/l`;
  }
  
  // Generic unit fallback
  return `₹${Math.round(price / num)}/${unit}`;
}
