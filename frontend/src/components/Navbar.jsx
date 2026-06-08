import React from 'react';

function Navbar({ isOnline }) {
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

        {/* Zepto Locked Pill */}
        <div className="status-pill-locked" title="Multi-platform price check is coming in future phases!">
          <span style={{ fontSize: '12px' }}>🔒</span>
          <span>Zepto — Coming Soon</span>
        </div>

        {/* Blinkit Locked Pill */}
        <div className="status-pill-locked" title="Multi-platform price check is coming in future phases!">
          <span style={{ fontSize: '12px' }}>🔒</span>
          <span>Blinkit — Coming Soon</span>
        </div>
      </div>
    </header>
  );
}

export default React.memo(Navbar);
