import React, { useState, useEffect, useRef, useCallback } from 'react';
import { reverseGeocode } from '../utils/geocode';

const CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Ahmedabad',
  'Surat',
  'Pune',
  'Hyderabad',
  'Chennai'
];

const PLACEHOLDERS = [
  'Try: Fortune Atta 1kg',
  'Try: Amul Butter 500g',
  'Try: Surf Excel 1kg'
];
const QUICKSEARCH = ['🥛 Dairy', '🌾 Atta & Rice', '🫙 Oils', '🥤 Beverages'];

function SearchBar({ onSearch, currentCity, currentQuery, isLoading }) {
  const [query, setQuery] = useState(currentQuery || '');
  const [city, setCity] = useState(currentCity || 'Mumbai');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Geolocation UI states
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [detectedViaGeo, setDetectedViaGeo] = useState(false);
  const dropdownRef = useRef(null);

  // Rotate placeholders every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Initialize from LocalStorage if available
  useEffect(() => {
    const savedLocation = localStorage.getItem('detected_location');
    const wasGeo = localStorage.getItem('detected_via_geo') === 'true';
    if (savedLocation) {
      setCity(savedLocation);
      setDetectedViaGeo(wasGeo);
    }
  }, []);

  // Sync city state with currentCity prop if it changes
  useEffect(() => {
    if (currentCity) {
      setCity(currentCity);
      const savedLocation = localStorage.getItem('detected_location');
      if (currentCity !== savedLocation) {
        setDetectedViaGeo(false);
      } else {
        setDetectedViaGeo(localStorage.getItem('detected_via_geo') === 'true');
      }
    }
  }, [currentCity]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = useCallback((selectedCity) => {
    setCity(selectedCity);
    setDetectedViaGeo(false);
    setIsOpen(false);
    localStorage.setItem('detected_location', selectedCity);
    localStorage.setItem('detected_via_geo', 'false');
  }, []);

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    // Geolocation requires a secure context (HTTPS or localhost)
    if (window.isSecureContext === false) {
      setLocationError("Geolocation requires a secure connection (HTTPS). Please select a city manually.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const resolvedAddress = await reverseGeocode(latitude, longitude);
          if (resolvedAddress) {
            setCity(resolvedAddress);
            setDetectedViaGeo(true);
            localStorage.setItem('detected_location', resolvedAddress);
            localStorage.setItem('detected_via_geo', 'true');
            setIsOpen(false);
          } else {
            setLocationError("Could not resolve address. Please select a city.");
          }
        } catch (err) {
          setLocationError("Error getting location address.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        let msg = "Could not detect location. Select a city manually.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Permission denied. Enable location or select a city.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Position unavailable. Select a city manually.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out. Select a city manually.";
        }
        setLocationError(msg);
        setIsLocating(false);
      },
      geoOptions
    );
  }, []);

  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim(), city);
  }, [query, city, isLoading, onSearch]);

  const handleChipClick = useCallback((categorySearch) => {
    if (isLoading) return;
    // Strip the emoji from chip text for the API search query
    const searchQuery = categorySearch.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
    setQuery(searchQuery);
    onSearch(searchQuery, city);
  }, [city, isLoading, onSearch]);

  return (
    <section className="hero-container hero-section">
      <div className="hero-grain" />

      <div className="hero-content">
        {/* Main Heading */}
        <h1 className="hero-title">
          Compare grocery prices across platforms
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          Search once. We check in InstaMART, Zepto & Blinkit Now.
        </p>

        {/* Pill-shaped Search Form */}
        <form onSubmit={handleSubmit} className="search-pill">
          {/* Custom Location Selection */}
          <div ref={dropdownRef} className="location-selector">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`location-dropdown-btn ${detectedViaGeo ? 'detected' : ''}`}
              title={city}
            >
              <span role="img" aria-label="city pin" style={{ fontSize: '15px' }}>
                {detectedViaGeo ? '📍' : ''}
              </span>
              <span style={{
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {city}
              </span>
              <span style={{ fontSize: '10px', opacity: 0.6 }}>
                {isOpen ? ' ▲' : ' ▼'}
              </span>
            </button>

            {isOpen && (
              <div className="location-dropdown">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="locate-btn"
                >
                  {isLocating ? (
                    <>
                      <div className="spinner"></div>
                      <span>Locating...</span>
                    </>
                  ) : (
                    <span>Detect my location</span>
                  )}
                </button>

                {locationError && (
                  <div className="location-error-badge">
                    <span role="img" aria-label="error icon">⚠️</span>
                    <span>{locationError}</span>
                  </div>
                )}

                <div className="location-divider" />

                <div className="dropdown-section-title">Or select a city</div>

                <div className="cities-grid">
                  {CITIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCitySelect(c)}
                      className={`city-option-btn ${city === c && !detectedViaGeo ? 'active' : ''}`}
                    >
                      <span style={{ fontSize: '12px' }}>📍</span>
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder={PLACEHOLDERS[placeholderIndex]}
            className="search-input"
          />

          {/* Search Action Button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="btn-search"
          >
            {/* Magnifying Glass Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <span style={{ display: 'inline' }}>Search</span>
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="suggestion-chips-container">
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginRight: '4px' }}>Quick search:</span>
          {QUICKSEARCH.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              disabled={isLoading}
              className="chip-btn"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default React.memo(SearchBar);
