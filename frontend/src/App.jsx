import React, { useState, useEffect, useReducer } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import ProductGrid from './components/ProductGrid';
import CompareDrawer from './components/CompareDrawer';
import AgentPanel from './components/AgentPanel';
import SkeletonLoader from './components/SkeletonLoader';
import { parseAgentResponse, generatePlatformUrl } from './utils/parseResponse';
import { trackRedirect } from './utils/analytics';

// ================= REDUCER SETUP =================
const initialState = {
  query: '',
  city: 'Mumbai',
  isLoading: false,
  results: [],
  compareList: [],
  queryHistory: [],
  error: null
};

function appReducer(state, action) {
  switch (action.type) {
    case 'START_SEARCH':
      return {
        ...state,
        query: action.payload.query,
        city: action.payload.city,
        isLoading: true,
        error: null,
        results: []
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

// ================= ERROR BOUNDARY =================
class ErrorBoundary extends React.Component {
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
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FEE2E2',
          borderRadius: '16px',
          margin: '60px auto',
          maxWidth: '600px',
          fontFamily: 'var(--font-sans)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }} role="img" aria-label="warning">⚠️</span>
          <h2 style={{ color: '#991B1B', fontFamily: 'var(--font-heading)', fontSize: '22px', marginBottom: '12px' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#7F1D1D', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
            {this.state.error ? this.state.error.toString() : "An unexpected UI error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#991B1B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(153,27,27,0.2)'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ================= BUY CHEAPEST BUTTON =================
function BuyCheapestButton({ results, city }) {
  if (!results || results.length === 0) return null;

  // Find the cheapest product in the current set
  const cheapestProduct = results.reduce((min, p) => p.price < min.price ? p : min, results[0]);

  const handleCheapestClick = () => {
    const platformUrl = cheapestProduct.platformUrl || generatePlatformUrl(cheapestProduct.name, 'instamart');
    trackRedirect({
      productName: cheapestProduct.name,
      platform: 'instamart',
      price: cheapestProduct.price,
      city: city || 'Mumbai'
    });
    window.open(platformUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleCheapestClick}
      style={{
        backgroundColor: 'var(--brand-dark)',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        padding: '6px 14px',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 2px 6px rgba(13,79,47,0.15)',
        transition: 'background-color 0.15s ease'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--brand-mid)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--brand-dark)'; }}
    >
      <span>🏷️ Buy Cheapest on InstaMART ↗</span>
    </button>
  );
}

// ================= MAIN APP COMPONENT =================
function MainApp() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isOnline, setIsOnline] = useState(true);
  const [lastRawLog, setLastRawLog] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(
    !!localStorage.getItem('basketai_redirect_notice_dismissed')
  );

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

  // Backend Health Checks
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`, { mode: 'cors' });
      setIsOnline(res.ok);
    } catch (e) {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  // Search trigger
  const handleSearch = async (queryText, cityName) => {
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
        dispatch({
          type: 'SEARCH_SUCCESS',
          payload: { products: parsedProducts, rawResult: rawText }
        });
      }

    } catch (err) {
      dispatch({
        type: 'SEARCH_FAILURE',
        payload: { error: "⚠️ Could not reach InstaMART right now. Try again in a moment." }
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Offline Banner strip */}
      {!isOnline && (
        <div style={{
          backgroundColor: '#EF4444',
          color: '#FFFFFF',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 700,
          position: 'sticky',
          top: 0,
          zIndex: 101,
          boxShadow: '0 2px 4px rgba(239,68,68,0.2)'
        }}>
          Backend offline — start the FastAPI server on port 8000 (or check network access to {API_URL})
        </div>
      )}

      <Navbar isOnline={isOnline} />
      
      <SearchBar
        onSearch={handleSearch}
        currentCity={state.city}
        currentQuery={state.query}
        isLoading={state.isLoading}
      />

      {/* Redirect Disclaimer Banner */}
      {!bannerDismissed && (
        <div style={{
          backgroundColor: '#FEF3C7',
          borderBottom: '1px solid #F59E0B',
          color: '#92400E',
          padding: '10px 24px',
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-sans)',
          width: '100%',
          boxShadow: '0 2px 4px rgba(245,158,11,0.05)'
        }}>
          <span>
            ℹ️ <strong>BasketAI is a price comparison tool.</strong> Clicking 'Buy' opens the retailer's website in a new tab — we never handle your order or payment.
          </span>
          <button
            onClick={() => {
              localStorage.setItem('basketai_redirect_notice_dismissed', 'true');
              setBannerDismissed(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#92400E',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '12px'
            }}
          >
            Got it ✕
          </button>
        </div>
      )}

      {/* Main Grid View */}
      <main style={{
        flex: 1,
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Error notification alerts */}
        {state.error && (
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FEE2E2',
            borderRadius: '12px',
            color: '#B91C1C',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{state.error}</span>
            <button
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
              style={{
                background: 'none',
                border: 'none',
                color: '#B91C1C',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                paddingLeft: '12px'
              }}
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
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '14px'
            }}>
              <div>
                <h2 style={{
                  fontSize: '20px',
                  color: 'var(--brand-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  Results for "{state.query}" in {state.city}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Swiggy Instamart quick-commerce scrape results
                </p>
              </div>
              
              {/* Badges and Buy cheapest CTA */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <BuyCheapestButton results={state.results} city={state.city} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(252, 128, 25, 0.08)',
                  border: '1px solid rgba(252, 128, 25, 0.15)',
                  height: '32px'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--instamart-orange)'
                  }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--instamart-orange)' }}>
                    {state.results.length} Products
                  </span>
                </div>
              </div>
            </div>

            <ProductGrid
              products={state.results}
              onAddToCompare={(p) => dispatch({ type: 'ADD_TO_COMPARE', payload: p })}
              onRemoveFromCompare={(p) => dispatch({ type: 'REMOVE_FROM_COMPARE', payload: p })}
              compareList={state.compareList}
            />
          </div>
        )}

        {/* Empty State */}
        {!state.isLoading && !state.error && hasSearched && state.results.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px dashed var(--border)',
            boxShadow: 'var(--shadow-card)',
            maxWidth: '600px',
            margin: '40px auto'
          }}>
            <span style={{ fontSize: '64px', display: 'block', marginBottom: '20px' }} role="img" aria-label="empty cart">🛒</span>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '20px',
              color: 'var(--brand-dark)',
              marginBottom: '8px'
            }}>
              No products found for "{state.query}"
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '28px' }}>
              We checked InstaMART in {state.city}. Try searching for common grocery goods or brands.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>POPULAR SUGGESTIONS:</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {['Amul Butter', 'Tata Salt', 'Fortune Oil'].map((sug) => (
                  <button
                    key={sug}
                    onClick={() => handleSearch(sug, state.city)}
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-pill)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-mid)'; e.currentTarget.style.color = 'var(--brand-mid)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
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
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-muted)'
          }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🥗</span>
            <p style={{ fontSize: '15px', fontWeight: 500 }}>
              Search for ingredients above to compare prices and check local availability.
            </p>
          </div>
        )}

        <AgentPanel
          history={state.queryHistory}
          rawLog={lastRawLog}
        />

      </main>

      {/* Sticky comparison table drawer */}
      <CompareDrawer
        compareList={state.compareList}
        onRemoveFromCompare={(p) => dispatch({ type: 'REMOVE_FROM_COMPARE', payload: p })}
        onClearAll={() => dispatch({ type: 'CLEAR_COMPARE' })}
        onClose={() => dispatch({ type: 'CLEAR_COMPARE' })}
      />

      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border)',
        padding: '24px',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--text-muted)',
        backgroundColor: 'var(--bg-card)'
      }}>
        BasketAI Quick Commerce Shopping Agent Console • Powered by Playwright Stealth Scrape
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
