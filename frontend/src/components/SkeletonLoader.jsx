import React, { useState, useEffect } from 'react';

const STATUS_TEXTS = [
  '🔍 Searching InstaMART, Zepto & Blinkit...',
  '🤖 Agent analysing results...',
  '📦 Fetching product details...',
  '✅ Almost done...'
];

export default function SkeletonLoader() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_TEXTS.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '24px 0', width: '100%' }}>
      {/* Animated Status Text */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '40px',
        gap: '12px'
      }}>
        {/* Loading Spinner */}
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(13, 79, 47, 0.1)',
          borderTop: '3px solid var(--brand-mid)',
          borderRadius: '50%',
          animation: 'pulse 1s infinite linear',
          display: 'inline-block'
        }} />
        
        {/* Cycle Text */}
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--brand-dark)',
          letterSpacing: '-0.2px',
          transition: 'all 0.3s ease'
        }}>
          {STATUS_TEXTS[statusIndex]}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Spawning quick-commerce scrapers. This can take up to 15-30 seconds.
        </p>
      </div>

      {/* Grid of 6 Pulsing Cards */}
      <div className="product-grid">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="pulse" style={{
            height: '380px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: '0'
          }}>
            {/* Top image placeholder */}
            <div style={{
              height: '140px',
              backgroundColor: '#F3F4F6',
              width: '100%'
            }} />
            
            {/* Inner details placeholders */}
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Category tag */}
              <div style={{ width: '40%', height: '12px', backgroundColor: '#E5E7EB', borderRadius: '4px' }} />
              
              {/* Product name lines */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ width: '90%', height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px' }} />
                <div style={{ width: '70%', height: '16px', backgroundColor: '#E5E7EB', borderRadius: '4px' }} />
              </div>
              
              {/* Weight tag */}
              <div style={{ width: '25%', height: '12px', backgroundColor: '#E5E7EB', borderRadius: '4px' }} />
              
              {/* Price row */}
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{ width: '35%', height: '24px', backgroundColor: '#E5E7EB', borderRadius: '4px' }} />
                <div style={{ width: '20%', height: '12px', backgroundColor: '#E5E7EB', borderRadius: '4px' }} />
              </div>

              {/* Action buttons row */}
              <div style={{
                display: 'flex',
                gap: '8px',
                borderTop: '1px solid var(--border)',
                paddingTop: '12px',
                marginTop: 'auto'
              }}>
                <div style={{ flex: 1.2, height: '38px', backgroundColor: '#F3F4F6', borderRadius: '8px' }} />
                <div style={{ flex: 1, height: '38px', backgroundColor: '#F3F4F6', borderRadius: '8px' }} />
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
