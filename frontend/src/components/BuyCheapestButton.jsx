import React from 'react';
import { generatePlatformUrl } from '../utils/parseResponse';
import { trackRedirect } from '../utils/analytics';

function BuyCheapestButton({ results, city }) {
  if (!results || results.length === 0) return null;

  // Find the cheapest product in the current set
  const cheapestProduct = results.reduce((min, p) => p.price < min.price ? p : min, results[0]);

  const handleCheapestClick = () => {
    const platformUrl = cheapestProduct.platformUrl || generatePlatformUrl(cheapestProduct.name, 'instamart');
    trackRedirect({
      productName: cheapestProduct.name,
      platform: 'instamart',
      price: cheapestProduct.price,
      city: city || 'Mumbai'
    });
    window.open(platformUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleCheapestClick}
      className="btn-buy-cheapest"
    >
      <span>🏷️ Buy Cheapest on InstaMART ↗</span>
    </button>
  );
}

export default React.memo(BuyCheapestButton);
