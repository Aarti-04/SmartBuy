import React, { useState, useEffect, useReducer, useCallback } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import ProductGrid from './components/ProductGrid';
import CompareDrawer from './components/CompareDrawer';
import AgentPanel from './components/AgentPanel';
import SkeletonLoader from './components/SkeletonLoader';
import ErrorBoundary from './components/ErrorBoundary';
import { parseAgentResponse, getUnavailablePlatforms } from './utils/parseResponse';

// ================= MODULE SCOPED CONSTANTS =================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const initialState = {
  query: '',
  city: 'Mumbai',
  isLoading: false,
  results: [],
  compareList: [],
  queryHistory: [],
  error: null,
  unavailablePlatforms: []
};

// ================= REDUCER SETUP =================
/**
 * @param {any} state
 * @param {any} action
 */
function appReducer(state, action) {
  switch (action.type) {
    case 'START_SEARCH':
      return {
        ...state,
        query: action.payload.query,
        city: action.payload.city,
        isLoading: true,
        error: null,
        results: [],
        unavailablePlatforms: []
      };
    case 'SEARCH_SUCCESS':
      const newHistoryItem = {
        query: state.query,
        city: state.city,
        results: action.payload.rawResult,
        timestamp: Date.now()
      };
      return {
        ...state,
        isLoading: false,
        results: action.payload.products,
        unavailablePlatforms: action.payload.unavailablePlatforms || [],
        queryHistory: [newHistoryItem, ...state.queryHistory]
      };
    case 'SEARCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
        results: []
      };
    case 'ADD_TO_COMPARE':
      if (state.compareList.length >= 3) {
        return {
          ...state,
          error: "You can compare a maximum of 3 products at a time."
        };
      }
      if (state.compareList.some(item => item.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        compareList: [...state.compareList, action.payload]
      };
    case 'REMOVE_FROM_COMPARE':
      return {
        ...state,
        compareList: state.compareList.filter(item => item.id !== action.payload.id)
      };
    case 'CLEAR_COMPARE':
      return {
        ...state,
        compareList: []
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

// ================= MAIN APP COMPONENT =================
function MainApp() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isOnline, setIsOnline] = useState(true);
  const [lastRawLog, setLastRawLog] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(
    !!(localStorage.getItem('smartbuy_redirect_notice_dismissed') || localStorage.getItem('basketai_redirect_notice_dismissed'))
  );
  const [devMode, setDevMode] = useState(() => {
    const val = localStorage.getItem('smartbuy_dev_mode') || localStorage.getItem('basketai_dev_mode');
    return val === 'true';
  });

  const handleToggleDevMode = useCallback(() => {
    setDevMode(prev => {
      const next = !prev;
      localStorage.setItem('smartbuy_dev_mode', String(next));
      return next;
    });
  }, []);

  // Backend Health Checks
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/health`, { mode: 'cors' });
      setIsOnline(res.ok);
    } catch (e) {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Search trigger callback
  const handleSearch = useCallback(async (queryText, cityName) => {
    dispatch({ type: 'START_SEARCH', payload: { query: queryText, city: cityName } });
    setHasSearched(true);

    try {
      const response = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, city: cityName }),
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error("HTTP failure status from backend API");
      }

      const data = await response.json();
      const rawText = data.result || '';
      setLastRawLog(rawText);

      // Parse response and assign search city context to each product object
      const parsedProducts = parseAgentResponse(rawText).map(p => ({
        ...p,
        city: cityName
      }));

      if (parsedProducts.length === 0 && rawText.trim().length > 0) {
        dispatch({
          type: 'SEARCH_FAILURE',
          payload: { error: `The agent returned an answer, but we couldn't parse structured product cards from it.` }
        });
      } else {
        const downPlatforms = getUnavailablePlatforms(rawText);
        dispatch({
          type: 'SEARCH_SUCCESS',
          payload: { 
            products: parsedProducts, 
            rawResult: rawText,
            unavailablePlatforms: downPlatforms
          }
        });
      }

    } catch (err) {
      dispatch({
        type: 'SEARCH_FAILURE',
        payload: { error: "⚠️ Could not reach InstaMART right now. Try again in a moment." }
      });
    }
  }, []);

  // Stable callbacks for product grid & compare list transitions
  const handleAddToCompare = useCallback((product) => {
    dispatch({ type: 'ADD_TO_COMPARE', payload: product });
  }, []);

  const handleRemoveFromCompare = useCallback((product) => {
    dispatch({ type: 'REMOVE_FROM_COMPARE', payload: product });
  }, []);

  const handleClearCompare = useCallback(() => {
    dispatch({ type: 'CLEAR_COMPARE' });
  }, []);

  const handleClearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const handleDismissBanner = useCallback(() => {
    localStorage.setItem('smartbuy_redirect_notice_dismissed', 'true');
    setBannerDismissed(true);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Offline Banner strip */}
      {!isOnline && (
        <div className="offline-banner">
          Backend offline — start the FastAPI server on port 8000 (or check network access to {API_URL})
        </div>
      )}

      <Navbar isOnline={isOnline} devMode={devMode} onToggleDevMode={handleToggleDevMode} />

      <SearchBar
        onSearch={handleSearch}
        currentCity={state.city}
        currentQuery={state.query}
        isLoading={state.isLoading}
      />

      {/* Redirect Disclaimer Banner */}
      {!bannerDismissed && (
        <div className="redirect-notice-banner">
          <span>
            ℹ️ <strong>SmartBuy is a price comparison tool.</strong> Clicking 'Buy' opens the retailer's website in a new tab — we never handle your order or payment.
          </span>
          <button
            onClick={handleDismissBanner}
            className="redirect-notice-btn"
          >
            Got it ✕
          </button>
        </div>
      )}

      {/* Main Grid View */}
      <main className="app-main-container">
        {/* Error notification alerts */}
        {state.error && (
          <div className="error-notification">
            <span>{state.error}</span>
            <button
              onClick={handleClearError}
              className="error-clear-btn"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {state.isLoading && <SkeletonLoader />}

        {/* Results layout */}
        {!state.isLoading && !state.error && state.results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {state.unavailablePlatforms && state.unavailablePlatforms.length > 0 && (
              <div className="platform-warning-banner" style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#B91C1C',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <div>
                  <strong>Platform Status:</strong> {state.unavailablePlatforms.map(p => {
                    if (p === 'instamart') return 'Swiggy Instamart';
                    if (p === 'zepto') return 'Zepto';
                    if (p === 'blinkit') return 'Blinkit';
                    return p.charAt(0).toUpperCase() + p.slice(1);
                  }).join(', ')} is down in {state.city}. Comparisons will exclude results from this platform.
                </div>
              </div>
            )}
            <div className="results-header-container">
              <div>
                <h2 className="results-title">
                  Results for "{state.query}" in {state.city}
                </h2>
                <p className="results-subtitle">
                  Swiggy Instamart & Zepto quick-commerce scrape results
                </p>
              </div>

              {/* Badges and Buy cheapest CTA */}
              <div className="results-badges">
                <div className="badge-instamart-products">
                  <span className="badge-instamart-dot" />
                  <span className="badge-instamart-text">
                    {state.results.length} Products
                  </span>
                </div>
              </div>
            </div>

            <ProductGrid
              products={state.results}
              onAddToCompare={handleAddToCompare}
              onRemoveFromCompare={handleRemoveFromCompare}
              compareList={state.compareList}
            />
          </div>
        )}

        {/* Empty State */}
        {!state.isLoading && !state.error && hasSearched && state.results.length === 0 && (
          <div className="empty-state-container">
            <span className="empty-state-emoji" role="img" aria-label="empty cart">🛒</span>
            <h3 className="empty-state-title">
              No products found for "{state.query}"
            </h3>
            <p className="empty-state-text">
              We checked InstaMART & Zepto in {state.city}. Try searching for common grocery goods or brands.
            </p>

            <div className="empty-state-suggestions">
              <span className="empty-state-suggestions-label">POPULAR SUGGESTIONS:</span>
              <div className="empty-state-suggestions-list">
                {['Amul Butter', 'Tata Salt', 'Fortune Oil'].map((sug) => (
                  <button
                    key={sug}
                    onClick={() => handleSearch(sug, state.city)}
                    className="suggestion-try-btn"
                  >
                    Try: {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Initial landing state */}
        {!hasSearched && (
          <div className="landing-state-container">
            <span className="landing-state-emoji">🥗</span>
            <p className="landing-state-text">
              Search for ingredients above to compare prices and check local availability.
            </p>
          </div>
        )}

        {devMode && (
          <AgentPanel
            history={state.queryHistory}
            rawLog={lastRawLog}
          />
        )}

      </main>

      {/* Sticky comparison table drawer */}
      <CompareDrawer
        compareList={state.compareList}
        results={state.results}
        onRemoveFromCompare={handleRemoveFromCompare}
        onClearAll={handleClearCompare}
        onClose={handleClearCompare}
      />

      <footer className="app-footer">
        SmartBuy Quick Commerce Shopping Agent Console • Powered by Playwright Stealth Scrape
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
