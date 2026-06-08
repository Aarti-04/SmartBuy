import React, { useState, useEffect, useRef } from 'react';

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
const QUICKSEARCH = ['🥛 Dairy', '🌾 Atta & Rice', '🫙 Oils', '🥤 Beverages']

// Reverse geocoding helper using client-side free APIs (BigDataCloud with Nominatim fallback)
const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || '';
      const city = data.city || data.principalSubdivision || '';
      if (locality && city) {
        return `${locality}, ${city}`;
      } else if (city) {
        return city;
      }
    }
  } catch (err) {
    console.warn('BigDataCloud geocoding failed, trying Nominatim fallback...', err);
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    if (res.ok) {
      const data = await res.json();
      const address = data.address || {};
      const suburb = address.suburb || address.neighbourhood || address.village || address.subdivision || '';
      const city = address.city || address.town || address.county || address.state || '';
      if (suburb && city) {
        return `${suburb}, ${city}`;
      } else if (city) {
        return city;
      } else if (data.display_name) {
        const parts = data.display_name.split(',');
        if (parts.length > 1) {
          return `${parts[0].trim()}, ${parts[1].trim()}`;
        }
        return parts[0].trim();
      }
    }
  } catch (err) {
    console.error('Nominatim reverse geocoding failed...', err);
  }

  return null;
};

export default function SearchBar({ onSearch, currentCity, currentQuery, isLoading }) {
  const [query, setQuery] = useState(currentQuery || '');
  const [city, setCity] = useState(currentCity || 'Mumbai');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState(true);

  // Geolocation UI states
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [detectedViaGeo, setDetectedViaGeo] = useState(false);
  const dropdownRef = useRef(null);

  // Rotate placeholders every 3.5 seconds with a subtle fade animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setFadeClass(true);
      }, 300); // match fade out
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

  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity);
    setDetectedViaGeo(false);
    setIsOpen(false);
    localStorage.setItem('detected_location', selectedCity);
    localStorage.setItem('detected_via_geo', 'false');
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
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
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim(), city);
  };

  const handleChipClick = (categorySearch) => {
    if (isLoading) return;
    // Strip the emoji from chip text for the API search query
    const searchQuery = categorySearch.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
    setQuery(searchQuery);
    onSearch(searchQuery, city);
  };

  return (
    <section className="hero-container" style={{
      padding: '60px 24px',
      textAlign: 'center',
      borderBottom: '1px solid var(--border)'
    }}>
      <div className="hero-grain" />

      <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Main Heading */}
        <h1 style={{
          fontSize: '38px',
          color: 'var(--brand-dark)',
          marginBottom: '12px',
          lineHeight: '1.2'
        }}>
          Compare grocery prices across platforms
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '16px',
          color: 'var(--text-muted)',
          marginBottom: '32px',
          fontWeight: 500
        }}>
          Search once. We check InstaMART now, Zepto & Blinkit soon.
        </p>

        {/* Pill-shaped Search Form */}
        <form onSubmit={handleSubmit} className="search-pill" style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: 'var(--radius-pill)',
          padding: '4px',
          height: '58px',
          marginBottom: '24px'
        }}>
          {/* Custom Location Selection */}
          <div ref={dropdownRef} className="location-selector" style={{
            paddingLeft: '16px',
            paddingRight: '12px',
            borderRight: '1px solid var(--border)'
          }}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`location-trigger ${detectedViaGeo ? 'detected' : ''}`}
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
                    <>
                      {/* <span role="img" aria-label="detect icon">🎯</span> */}
                      <span>Detect my location</span>
                    </>
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
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              padding: '0 16px',
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              color: 'var(--text-primary)',
              transition: 'opacity 0.2s ease',
              width: '100%'
            }}
          />

          {/* Search Action Button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            style={{
              backgroundColor: 'var(--brand-mid)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              height: '50px',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: (!query.trim() || isLoading) ? 'not-allowed' : 'pointer',
              opacity: (!query.trim() || isLoading) ? 0.7 : 1,
              transition: 'transform 0.1s ease, background-color 0.2s ease'
            }}
            onMouseDown={(e) => { if (query.trim() && !isLoading) e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {/* Magnifying Glass Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <span style={{ display: 'inline' }}>Search</span>
          </button>
        </form>

        {/* Suggestion Chips */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, marginRight: '4px' }}>Quick search:</span>
          {QUICKSEARCH.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              disabled={isLoading}
              style={{
                border: '1px solid rgba(13, 79, 47, 0.25)',
                backgroundColor: 'rgba(13, 79, 47, 0.03)',
                color: 'var(--brand-dark)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.backgroundColor = 'var(--brand-dark)'; e.currentTarget.style.color = '#FFFFFF'; } }}
              onMouseLeave={(e) => { if (!isLoading) { e.currentTarget.style.backgroundColor = 'rgba(13, 79, 47, 0.03)'; e.currentTarget.style.color = 'var(--brand-dark)'; } }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
