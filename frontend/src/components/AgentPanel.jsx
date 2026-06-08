import React, { useState } from 'react';

export default function AgentPanel({ history, rawLog }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section style={{ marginTop: '32px', marginBottom: '32px' }}>
      
      {/* Toggle Link */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            color: 'var(--brand-mid)',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'rgba(26, 122, 71, 0.05)',
            border: '1px solid rgba(26, 122, 71, 0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}
        >
          <span>🤖</span>
          <span>{isOpen ? 'Hide agent reasoning' : 'See agent reasoning & terminal logs'}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Expanded Console Box */}
      {isOpen && (
        <div className="terminal-box">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #222',
            paddingBottom: '8px',
            marginBottom: '14px',
            fontSize: '12px',
            color: '#666'
          }}>
            <span>SYSTEM CONSOLE // AGENT_THINKING_ENGINE</span>
            <span style={{ color: '#00FF88', animation: 'pulse 1s infinite' }}>● ONLINE</span>
          </div>

          {/* Current thinking log */}
          {rawLog ? (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ color: '#888', marginBottom: '6px', fontSize: '12px' }}>&gt; CURRENT RUN LOGS:</div>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                fontSize: '13px',
                lineHeight: '1.6',
                maxHeight: '260px',
                overflowY: 'auto',
                color: '#00FF88'
              }}>
                {rawLog}
              </pre>
            </div>
          ) : (
            <div style={{ color: '#555', fontSize: '13px', fontStyle: 'italic', marginBottom: '24px' }}>
              &gt; No active run session log. Submit a search to view real-time tool calling logs.
            </div>
          )}

          {/* History log */}
          <div>
            <div style={{ color: '#888', marginBottom: '10px', fontSize: '12px', borderTop: '1px solid #222', paddingTop: '14px' }}>
              &gt; AGENT SESSION RUN HISTORY:
            </div>
            
            {history.length === 0 ? (
              <p style={{ color: '#555', fontSize: '13px', fontStyle: 'italic' }}>No session history recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                {history.map((item, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #1C1C1C',
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.02)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: '#666',
                      marginBottom: '6px'
                    }}>
                      <span>TIMESTAMP: {new Date(item.timestamp).toLocaleTimeString()}</span>
                      <span>CITY: {item.city.toUpperCase()}</span>
                    </div>
                    <div style={{ color: '#E0E0E0', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                      Query: "{item.query}"
                    </div>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      fontSize: '11px',
                      color: '#888',
                      lineHeight: '1.4'
                    }}>
                      {item.results}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </section>
  );
}
