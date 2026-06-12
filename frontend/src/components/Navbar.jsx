import React from 'react';

function Navbar({ isOnline, devMode, onToggleDevMode }) {
  return (
    <header className="navbar-header">
      {/* Brand Logo */}
      <div className="navbar-brand">
        <span className="navbar-logo" role="img" aria-label="grocery bag">🛍️</span>
        <span className="navbar-brand-name">
          Basket<span style={{ color: 'var(--brand-accent)' }}>AI</span>
        </span>
      </div>

      {/* Platform Statuses */}
      <div className="status-pills">
        {/* InstaMART Active Pill */}
        <div className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
          <span>InstaMART {isOnline ? 'Live' : 'Checking...'}</span>
        </div>

        {/* Zepto Live Pill */}
        <div className="status-pill online" style={{ backgroundColor: '#F3E8FF', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#6D28D9' }}>
          <span className="status-dot online" style={{ backgroundColor: '#8B5CF6', boxShadow: '0 0 8px #8B5CF6' }} />
          <span>Zepto Live</span>
        </div>

        {/* Blinkit Locked Pill */}
        <div className="status-pill-locked" title="Blinkit price checks are coming soon!">
          <span style={{ fontSize: '12px' }}>🔒</span>
          <span>Blinkit — Coming Soon</span>
        </div>

        {/* Developer Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDevMode}
          className={`status-pill ${devMode ? 'dev-active' : 'dev-inactive'}`}
          style={{
            cursor: 'pointer',
            border: devMode ? '1px solid #10B981' : '1px solid var(--border)',
            backgroundColor: devMode ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)',
            color: devMode ? '#10B981' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.2s',
            marginLeft: '8px'
          }}
        >
          <span>🛠️ Dev Mode: {devMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </header>
  );
}

export default React.memo(Navbar);
