import React from 'react';
import { trackRedirect } from '../utils/analytics';

export default function CompareDrawer({
  compareList,
  onRemoveFromCompare,
  onClearAll,
  onClose
}) {
  if (!compareList || compareList.length === 0) return null;

  return (
    <div className="animate-slide-up" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      borderTop: '2px solid var(--brand-dark)',
      boxShadow: '0 -10px 30px rgba(13,79,47,0.15)',
      zIndex: 1000,
      padding: '24px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '18px',
              color: 'var(--brand-dark)'
            }}>
              Price Comparison ({compareList.length}/3 items)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onClearAll}
              style={{
                background: 'none',
                border: 'none',
                color: '#EF5350',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Clear All
            </button>
            
            {/* Close Cross */}
            <button
              onClick={onClose}
              style={{
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: 'var(--text-muted)',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Product Details</th>
                <th style={{ padding: '10px', color: 'var(--brand-dark)', fontWeight: 700 }}>Swiggy InstaMART</th>
                <th style={{ padding: '10px', color: '#9CA3AF', fontWeight: 600 }}>Zepto 🔒</th>
                <th style={{ padding: '10px', color: '#9CA3AF', fontWeight: 600 }}>Blinkit 🔒</th>
                <th style={{ padding: '10px', width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {compareList.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', height: '70px' }}>
                  
                  {/* Name and Qty */}
                  <td style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '22px',
                        padding: '4px',
                        background: product.gradient,
                        borderRadius: '6px'
                      }}>
                        {product.emoji}
                      </span>
                      <div>
                        <a
                          href={product.platformUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackRedirect({
                            productName: product.name,
                            platform: product.platform,
                            price: product.price,
                            city: product.city || 'Mumbai'
                          })}
                          style={{
                            fontWeight: 700,
                            color: 'var(--brand-dark)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                        >
                          {product.name} ↗
                        </a>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Qty: {product.quantity}</div>
                      </div>
                    </div>
                  </td>

                  {/* InstaMART Price */}
                  <td style={{ padding: '10px', fontWeight: 700, color: 'var(--brand-dark)', fontSize: '16px', verticalAlign: 'middle' }}>
                    <div>
                      <span>₹{product.price}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '4px' }}>
                        ({product.unitPrice})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        trackRedirect({
                          productName: product.name,
                          platform: product.platform,
                          price: product.price,
                          city: product.city || 'Mumbai'
                        });
                        window.open(product.platformUrl, '_blank', 'noopener,noreferrer');
                      }}
                      style={{
                        marginTop: '4px',
                        backgroundColor: 'var(--brand-accent)',
                        color: 'var(--brand-dark)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        boxShadow: '0 1px 4px rgba(37,211,102,0.15)'
                      }}
                    >
                      Buy ↗
                    </button>
                  </td>

                  {/* Zepto Locked */}
                  <td
                    style={{ padding: '10px', color: '#9CA3AF', fontStyle: 'italic', fontSize: '12px', verticalAlign: 'middle' }}
                    title="We'll redirect you to Zepto when integrated"
                  >
                    <span>Coming Soon</span>
                  </td>

                  {/* Blinkit Locked */}
                  <td
                    style={{ padding: '10px', color: '#9CA3AF', fontStyle: 'italic', fontSize: '12px', verticalAlign: 'middle' }}
                    title="We'll redirect you to Blinkit when integrated"
                  >
                    <span>Coming Soon</span>
                  </td>

                  {/* Remove Action Button */}
                  <td style={{ padding: '10px', textAlign: 'right', verticalAlign: 'middle' }}>
                    <button
                      onClick={() => onRemoveFromCompare(product)}
                      title="Remove product"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF5350',
                        fontSize: '18px',
                        cursor: 'pointer'
                      }}
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
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginTop: '16px',
          borderTop: '1px solid var(--border)',
          paddingTop: '12px'
        }}>
          💡 BasketAI compares prices only. All purchases happen directly on the platform's website. We don't store your order or payment data.
        </div>

      </div>
    </div>
  );
}
