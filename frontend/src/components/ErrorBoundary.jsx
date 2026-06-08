import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <span className="error-boundary-emoji" role="img" aria-label="warning">⚠️</span>
          <h2 className="error-boundary-title">
            Something went wrong
          </h2>
          <p className="error-boundary-message">
            {this.state.error ? this.state.error.toString() : "An unexpected UI error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="error-boundary-btn"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
