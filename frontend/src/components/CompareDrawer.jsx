import React, { useCallback } from 'react';
import { trackRedirect } from '../utils/analytics';

function CompareDrawer({
  compareList,
  onRemoveFromCompare,
  onClearAll,
  onClose
}) {
  const handleProductRedirect = useCallback((product) => {
    trackRedirect({
      productName: product.name,
      platform: product.platform,
      price: product.price,
      city: product.city || 'Mumbai'
    });
    window.open(product.platformUrl, '_blank', 'noopener,noreferrer');
  }, []);

  if (!compareList || compareList.length === 0) return null;

  return (
    <div className="compare-drawer-container animate-slide-up">
      <div className="compare-drawer-inner">
        
        {/* Header Row */}
        <div className="compare-drawer-header">
          <div className="compare-drawer-title-container">
            <span className="compare-drawer-title-emoji">📊</span>
            <h3 className="compare-drawer-title">
              Price Comparison ({compareList.length}/3 items)
            </h3>
          </div>

          <div className="compare-drawer-actions">
            <button
              type="button"
              onClick={onClearAll}
              className="btn-clear-all"
            >
              Clear All
            </button>
            
            {/* Close Cross */}
            <button
              type="button"
              onClick={onClose}
              className="btn-close-drawer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="compare-table-wrapper">
          <table className="compare-table">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th className="compare-table-header-details">Product Details</th>
                <th className="compare-table-header-instamart">Swiggy InstaMART</th>
                <th className="compare-table-header-locked">Zepto 🔒</th>
                <th className="compare-table-header-locked">Blinkit 🔒</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {compareList.map((product) => (
                <tr key={product.id} className="compare-table-row">
                  
                  {/* Name and Qty */}
                  <td>
                    <div className="product-cell-detail">
                      <span
                        className="product-cell-emoji"
                        style={{ background: product.gradient }}
                      >
                        {product.emoji}
                      </span>
                      <div>
                        <a
                          href={product.platformUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            handleProductRedirect(product);
                          }}
                          className="product-cell-name"
                        >
                          {product.name} ↗
                        </a>
                        <div className="product-cell-qty">Qty: {product.quantity}</div>
                      </div>
                    </div>
                  </td>

                  {/* InstaMART Price */}
                  <td style={{ verticalAlign: 'middle' }}>
                    <div className="price-cell-value">
                      <span>₹{product.price}</span>
                      <span className="price-cell-unit">
                        ({product.unitPrice})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleProductRedirect(product)}
                      className="btn-buy-drawer"
                    >
                      Buy ↗
                    </button>
                  </td>

                  {/* Zepto Locked */}
                  <td
                    className="coming-soon-cell"
                    title="We'll redirect you to Zepto when integrated"
                  >
                    <span>Coming Soon</span>
                  </td>

                  {/* Blinkit Locked */}
                  <td
                    className="coming-soon-cell"
                    title="We'll redirect you to Blinkit when integrated"
                  >
                    <span>Coming Soon</span>
                  </td>

                  {/* Remove Action Button */}
                  <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                    <button
                      type="button"
                      onClick={() => onRemoveFromCompare(product)}
                      title="Remove product"
                      className="btn-remove-drawer"
                    >
                      🗑️
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer disclaimer */}
        <div className="compare-footer-disclaimer">
          💡 BasketAI compares prices only. All purchases happen directly on the platform's website. We don't store your order or payment data.
        </div>

      </div>
    </div>
  );
}

export default React.memo(CompareDrawer);
