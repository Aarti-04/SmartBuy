import React, { useState } from 'react';
import { PLATFORM_CONFIG } from '../utils/platformConfig';
import { trackRedirect } from '../utils/analytics';

export default function ProductCard({
  product,
  onAddToCompare,
  onRemoveFromCompare,
  isAddedToCompare
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = (e) => {
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  const handleCompareClick = (e) => {
    e.stopPropagation();
    if (isAddedToCompare) {
      onRemoveFromCompare(product);
    } else {
      onAddToCompare(product);
    }
  };

  const handleBuyClick = (e) => {
    e.stopPropagation();
    const config = PLATFORM_CONFIG[product.platform] || PLATFORM_CONFIG.instamart;
    trackRedirect({
      productName: product.name,
      platform: product.platform,
      price: product.price,
      city: product.city || 'Mumbai'
    });
    window.open(product.platformUrl, '_blank', 'noopener,noreferrer');
  };

  const config = PLATFORM_CONFIG[product.platform] || PLATFORM_CONFIG.instamart;

  return (
    <div className={`card-perspective ${isFlipped ? 'is-flipped' : ''}`}>
      <div className="card-inner">
        
        {/* ================= CARD FRONT ================= */}
        <div className="card-front">
          {/* Category Graphic Area */}
          <div style={{
            background: product.gradient,
            height: '140px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '52px',
          }}>
            {product.emoji}

            {/* Best Price Badge */}
            {product.isBestPrice && (
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'var(--brand-accent)',
                color: 'var(--brand-dark)',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                boxShadow: '0 2px 6px rgba(37,211,102,0.3)',
                letterSpacing: '0.5px'
              }}>
                BEST PRICE
              </div>
            )}

            {/* Price Intelligence Flip Trigger */}
            <button
              onClick={toggleFlip}
              title="View Price Intelligence"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--brand-dark)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <span>💡 Price Intelligence</span>
            </button>
          </div>

          {/* Product Details Section */}
          <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* Platform Tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: config.dotColor,
                display: 'inline-block'
              }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Swiggy {config.label}
              </span>
            </div>

            {/* Product Name */}
            <h3 style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: '1.4',
              marginBottom: '4px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              height: '42px',
              cursor: 'pointer'
            }} title={product.name}>
              {product.name}
            </h3>

            {/* Quantity */}
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '12px'
            }}>
              Quantity: {product.quantity}
            </p>

            {/* Price rows */}
            <div style={{ marginTop: 'auto', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--brand-dark)'
                }}>
                  ₹{product.price}
                </span>
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  fontWeight: 500
                }}>
                  ({product.unitPrice})
                </span>
              </div>
            </div>

            {/* Card Action Row */}
            <div style={{
              display: 'flex',
              gap: '8px',
              borderTop: '1px solid var(--border)',
              paddingTop: '12px',
              marginTop: 'auto'
            }}>
              
              {/* Add to Compare */}
              <button
                type="button"
                onClick={handleCompareClick}
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '8px',
                  border: `1.5px solid ${isAddedToCompare ? '#EF5350' : 'var(--brand-mid)'}`,
                  backgroundColor: isAddedToCompare ? '#FFEBEE' : 'transparent',
                  color: isAddedToCompare ? '#C62828' : 'var(--brand-dark)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{isAddedToCompare ? 'Remove' : '+ Compare'}</span>
              </button>

              {/* Buy on Platform Button */}
              <button
                type="button"
                onClick={handleBuyClick}
                title={`Opens ${config.label} in a new tab. BasketAI does not handle orders or payments.`}
                style={{
                  flex: 1.5,
                  height: '38px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--brand-dark)',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--brand-mid)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--brand-dark)'; }}
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: config.dotColor,
                  display: 'inline-block'
                }} />
                <span>{config.buttonLabel}</span>
              </button>

            </div>

          </div>
        </div>

        {/* ================= CARD BACK (Price Intelligence) ================= */}
        <div className="card-back" style={{ backgroundColor: '#0D1F15', color: '#E0F2FE' }}>
          
          {/* Header */}
          <div style={{
            borderBottom: '1px solid #1A3F25',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px' }}>💰</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700, color: '#25D366', letterSpacing: '0.5px' }}>
                Price Intelligence
              </span>
            </div>

            {/* Back Button */}
            <button
              onClick={toggleFlip}
              style={{
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#25D366',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ↩
            </button>
          </div>

          {/* Pricing Table Content */}
          <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{
              height: '1px',
              backgroundColor: '#1A3F25',
              width: '100%',
              margin: '0 0 4px 0'
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* InstaMART Price Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0'
              }}>
                <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 500 }}>InstaMART</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#25D366' }}>
                    ₹{product.price}
                  </span>
                  <button
                    onClick={handleBuyClick}
                    style={{
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: '#25D366',
                      color: 'var(--brand-dark)',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      cursor: 'pointer',
                      transition: 'opacity 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    Buy ↗
                  </button>
                </div>
              </div>

              {/* Zepto Locked Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
                color: '#64748B'
              }}>
                <span style={{ fontSize: '13px' }}>Zepto</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>
                  🔒 Soon
                </span>
              </div>

              {/* Blinkit Locked Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
                color: '#64748B'
              }}>
                <span style={{ fontSize: '13px' }}>Blinkit</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>
                  🔒 Soon
                </span>
              </div>

            </div>

            {/* Best price indicator */}
            <div style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#25D366',
              fontWeight: 700
            }}>
              <span>✅</span>
              <span>Best available price</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
