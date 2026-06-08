import React, { useState } from 'react';

function AgentPanel({ history, rawLog }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="agent-panel-container">
      
      {/* Toggle Link */}
      <div className="agent-toggle-wrapper">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="btn-agent-toggle"
        >
          <span>🤖</span>
          <span>{isOpen ? 'Hide agent reasoning' : 'See agent reasoning & terminal logs'}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Expanded Console Box */}
      {isOpen && (
        <div className="terminal-box">
          <div className="terminal-header">
            <span>SYSTEM CONSOLE // AGENT_THINKING_ENGINE</span>
            <span className="terminal-status">● ONLINE</span>
          </div>

          {/* Current thinking log */}
          {rawLog ? (
            <div className="terminal-logs-container">
              <div className="terminal-logs-label">&gt; CURRENT RUN LOGS:</div>
              <pre className="terminal-pre-log">
                {rawLog}
              </pre>
            </div>
          ) : (
            <div className="terminal-no-session">
              &gt; No active run session log. Submit a search to view real-time tool calling logs.
            </div>
          )}

          {/* History log */}
          <div>
            <div className="terminal-history-container">
              &gt; AGENT SESSION RUN HISTORY:
            </div>
            
            {history.length === 0 ? (
              <p style={{ color: '#555', fontSize: '13px', fontStyle: 'italic' }}>No session history recorded.</p>
            ) : (
              <div className="history-list">
                {history.map((item, idx) => (
                  <div key={idx} className="history-item">
                    <div className="history-item-meta">
                      <span>TIMESTAMP: {new Date(item.timestamp).toLocaleTimeString()}</span>
                      <span>CITY: {item.city.toUpperCase()}</span>
                    </div>
                    <div className="history-item-query">
                      Query: "{item.query}"
                    </div>
                    <pre className="history-item-pre">
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

export default React.memo(AgentPanel);
