import React, { useCallback } from 'react';
import { trackRedirect } from '../utils/analytics';

function CompareDrawer({
  compareList,
  results = [],
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
                <th className="compare-table-header-instamart">Swiggy Instamart</th>
                <th className="compare-table-header-zepto" style={{ color: '#8B5CF6', fontWeight: 700 }}>Zepto</th>
                <th className="compare-table-header-locked">Blinkit 🔒</th>
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {compareList.map((product) => {
                const getFuzzyKey = (nameStr) => {
                  return nameStr.toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(' ');
                };
                const key = getFuzzyKey(product.name);

                let instamartProduct = null;
                let zeptoProduct = null;

                if (product.platform === 'instamart') {
                  instamartProduct = product;
                  zeptoProduct = results.find(p => p.platform === 'zepto' && getFuzzyKey(p.name) === key);
                } else {
                  zeptoProduct = product;
                  instamartProduct = results.find(p => p.platform === 'instamart' && getFuzzyKey(p.name) === key);
                }

                let summaryText = null;
                if (instamartProduct && zeptoProduct) {
                  const diff = instamartProduct.price - zeptoProduct.price;
                  if (diff > 0) {
                    summaryText = `Zepto is ₹${diff} cheaper ⚡`;
                  } else if (diff < 0) {
                    summaryText = `Instamart is ₹${Math.abs(diff)} cheaper ⚡`;
                  } else {
                    summaryText = "Same price on both platforms";
                  }
                }

                return (
                  <tr key={product.id} className="compare-table-row">
                    
                    {/* Name and Qty */}
                    <td>
                      <div className="product-cell-detail">
                        <span
                          className="product-cell-emoji"
                          style={{ background: product.gradient, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'white' }}
                            />
                          ) : (
                            product.emoji
                          )}
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
                          <div className="product-cell-qty" style={{ marginBottom: summaryText ? '4px' : '0' }}>
                            Qty: {product.quantity}
                          </div>
                          {summaryText && (
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: summaryText.includes('cheaper') ? '#10B981' : 'var(--text-muted)',
                              backgroundColor: summaryText.includes('cheaper') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.05)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'inline-block'
                            }}>
                              {summaryText}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* InstaMART Price */}
                    <td style={{ verticalAlign: 'middle' }}>
                      {instamartProduct ? (
                        <>
                          <div className="price-cell-value">
                            <span>₹{instamartProduct.price}</span>
                            <span className="price-cell-unit">
                              ({instamartProduct.unitPrice})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleProductRedirect(instamartProduct)}
                            className="btn-buy-drawer"
                          >
                            Buy ↗
                          </button>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Not Available</span>
                      )}
                    </td>

                    {/* Zepto Price */}
                    <td style={{ verticalAlign: 'middle' }}>
                      {zeptoProduct ? (
                        <>
                          <div className="price-cell-value">
                            <span>₹{zeptoProduct.price}</span>
                            <span className="price-cell-unit">
                              ({zeptoProduct.unitPrice})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleProductRedirect(zeptoProduct)}
                            className="btn-buy-drawer"
                            style={{ backgroundColor: '#8B5CF6' }}
                          >
                            Buy ↗
                          </button>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Not Available</span>
                      )}
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
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer disclaimer */}
        <div className="compare-footer-disclaimer">
          💡 SmartBuy compares prices only. All purchases happen directly on the platform's website. We don't store your order or payment data.
        </div>

      </div>
    </div>
  );
}

export default React.memo(CompareDrawer);
