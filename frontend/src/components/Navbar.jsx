import React from 'react';

export default function Navbar({ isOnline }) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '26px' }} role="img" aria-label="grocery bag">🛍️</span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '22px',
          fontWeight: 800,
          color: 'var(--brand-dark)',
          letterSpacing: '-0.5px'
        }}>
          Basket<span style={{ color: 'var(--brand-accent)' }}>AI</span>
        </span>
      </div>

      {/* Platform Statuses */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        
        {/* InstaMART Active Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: isOnline ? '#E8F5E9' : '#FFEBEE',
          border: `1px solid ${isOnline ? 'rgba(37, 211, 102, 0.2)' : 'rgba(239, 83, 80, 0.2)'}`,
          fontSize: '13px',
          fontWeight: 600,
          color: isOnline ? 'var(--brand-dark)' : '#C62828'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isOnline ? 'var(--brand-accent)' : '#EF5350',
            display: 'inline-block',
            boxShadow: isOnline ? '0 0 8px var(--brand-accent)' : 'none',
            animation: isOnline ? 'pulse 1.5s infinite' : 'none'
          }} />
          <span>InstaMART {isOnline ? 'Live' : 'Checking...'}</span>
        </div>

        {/* Zepto Locked Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: '#F3F4F6',
          border: '1px solid #E5E7EB',
          fontSize: '13px',
          fontWeight: 500,
          color: '#9CA3AF',
          cursor: 'not-allowed'
        }} title="Multi-platform price check is coming in future phases!">
          <span style={{ fontSize: '12px' }}>🔒</span>
          <span>Zepto — Coming Soon</span>
        </div>

        {/* Blinkit Locked Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: '#F3F4F6',
          border: '1px solid #E5E7EB',
          fontSize: '13px',
          fontWeight: 500,
          color: '#9CA3AF',
          cursor: 'not-allowed'
        }} title="Multi-platform price check is coming in future phases!">
          <span style={{ fontSize: '12px' }}>🔒</span>
          <span>Blinkit — Coming Soon</span>
        </div>

      </div>
    </header>
  );
}
