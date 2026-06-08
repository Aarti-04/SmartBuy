import React, { useState, useCallback } from 'react';
import { PLATFORM_CONFIG } from '../utils/platformConfig';
import { trackRedirect } from '../utils/analytics';

function ProductCard({
  product,
  onAddToCompare,
  onRemoveFromCompare,
  isAddedToCompare
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = useCallback((e) => {
    e.stopPropagation();
    setIsFlipped((prev) => !prev);
  }, []);

  const handleCompareClick = useCallback((e) => {
    e.stopPropagation();
    if (isAddedToCompare) {
      onRemoveFromCompare(product);
    } else {
      onAddToCompare(product);
    }
  }, [product, onAddToCompare, onRemoveFromCompare, isAddedToCompare]);

  const handleBuyClick = useCallback((e) => {
    e.stopPropagation();
    trackRedirect({
      productName: product.name,
      platform: product.platform,
      price: product.price,
      city: product.city || 'Mumbai'
    });
    window.open(product.platformUrl, '_blank', 'noopener,noreferrer');
  }, [product]);

  const config = PLATFORM_CONFIG[product.platform] || PLATFORM_CONFIG.instamart;

  return (
    <div className={`card-perspective ${isFlipped ? 'is-flipped' : ''}`}>
      <div className="card-inner">
        
        {/* ================= CARD FRONT ================= */}
        <div className="card-front">
          {/* Category Graphic Area */}
          <div className="product-card-graphic" style={{ background: product.gradient }}>
            {product.emoji}

            {/* Best Price Badge */}
            {product.isBestPrice && (
              <div className="best-price-badge">
                BEST PRICE
              </div>
            )}

            {/* Price Intelligence Flip Trigger */}
            <button
              type="button"
              onClick={toggleFlip}
              title="View Price Intelligence"
              className="price-intel-btn"
            >
              <span>💡 Price Intelligence</span>
            </button>
          </div>

          {/* Product Details Section */}
          <div className="product-card-details">
            {/* Platform Tag */}
            <div className="platform-tag">
              <span className="platform-dot" style={{ backgroundColor: config.dotColor }} />
              <span className="platform-label">
                Swiggy {config.label}
              </span>
            </div>

            {/* Product Name */}
            <h3 className="product-name-heading" title={product.name}>
              {product.name}
            </h3>

            {/* Quantity */}
            <p className="product-qty">
              Quantity: {product.quantity}
            </p>

            {/* Price rows */}
            <div className="product-price-row">
              <div className="product-price-container">
                <span className="product-price-amount">
                  ₹{product.price}
                </span>
                <span className="product-unit-price">
                  ({product.unitPrice})
                </span>
              </div>
            </div>

            {/* Card Action Row */}
            <div className="product-actions">
              {/* Add to Compare */}
              <button
                type="button"
                onClick={handleCompareClick}
                className={`btn-compare ${isAddedToCompare ? 'added' : 'not-added'}`}
              >
                <span>{isAddedToCompare ? 'Remove' : '+ Compare'}</span>
              </button>

              {/* Buy on Platform Button */}
              <button
                type="button"
                onClick={handleBuyClick}
                title={`Opens ${config.label} in a new tab. BasketAI does not handle orders or payments.`}
                className="btn-buy"
              >
                <span className="btn-buy-bullet" style={{ backgroundColor: config.dotColor }} />
                <span>{config.buttonLabel}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= CARD BACK (Price Intelligence) ================= */}
        <div className="card-back" style={{ backgroundColor: '#0D1F15', color: '#E0F2FE' }}>
          {/* Header */}
          <div className="card-back-header">
            <div className="card-back-title-container">
              <span style={{ fontSize: '18px' }}>💰</span>
              <span className="card-back-title">
                Price Intelligence
              </span>
            </div>

            {/* Back Button */}
            <button
              type="button"
              onClick={toggleFlip}
              className="card-back-return"
            >
              ↩
            </button>
          </div>

          {/* Pricing Table Content */}
          <div className="card-back-content">
            <div className="card-back-divider" />

            <div className="price-rows-container">
              {/* InstaMART Price Row */}
              <div className="price-row active">
                <span className="price-row-platform">InstaMART</span>
                <div className="price-row-values">
                  <span className="price-row-value">
                    ₹{product.price}
                  </span>
                  <button
                    type="button"
                    onClick={handleBuyClick}
                    className="btn-buy-small"
                  >
                    Buy ↗
                  </button>
                </div>
              </div>

              {/* Zepto Locked Row */}
              <div className="price-row disabled">
                <span className="price-row-platform">Zepto</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>
                  🔒 Soon
                </span>
              </div>

              {/* Blinkit Locked Row */}
              <div className="price-row disabled">
                <span className="price-row-platform">Blinkit</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>
                  🔒 Soon
                </span>
              </div>
            </div>

            {/* Best price indicator */}
            <div className="best-price-indicator">
              <span>✅</span>
              <span>Best available price</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default React.memo(ProductCard);
