import React, { useState, useEffect, useRef } from 'react';
import './LocationSelector.css';

const LocationSelector = ({ location, setLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchInputRef = useRef(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedQuery)}&addressdetails=1&limit=5`,
          {
            headers: {
              'User-Agent': 'ConnectHub-Social-App'
            }
          }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Error fetching autocomplete locations:', err);
        setError('Error fetching locations');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  const handleSelectPlace = (place) => {
    const addr = place.address || {};
    const name = place.display_name.split(',')[0] || addr.suburb || addr.neighbourhood || 'Selected Location';
    const city = addr.city || addr.town || addr.village || addr.suburb || '';
    const state = addr.state || '';
    const country = addr.country || '';
    const latitude = parseFloat(place.lat);
    const longitude = parseFloat(place.lon);
    const placeId = place.place_id ? place.place_id.toString() : `place_${Date.now()}`;

    setLocation({
      name,
      address: place.display_name,
      city,
      state,
      country,
      latitude,
      longitude,
      placeId
    });
    setIsOpen(false);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'ConnectHub-Social-App'
              }
            }
          );
          if (!res.ok) throw new Error('Reverse geocoding failed');
          const data = await res.json();
          
          const addr = data.address || {};
          const name = addr.road || addr.suburb || addr.neighbourhood || 'Current Location';
          const city = addr.city || addr.town || addr.village || addr.suburb || '';
          const state = addr.state || '';
          const country = addr.country || '';
          const placeId = data.place_id ? data.place_id.toString() : `place_${Date.now()}`;

          setLocation({
            name,
            address: data.display_name,
            city,
            state,
            country,
            latitude,
            longitude,
            placeId
          });
          setIsOpen(false);
          setSearchQuery('');
          setSuggestions([]);
        } catch (err) {
          console.error(err);
          setError('Failed to fetch details for your current coordinates');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (err.code === 1) {
          setError('Location access denied. Please search manually.');
        } else {
          setError('Error retrieving your current coordinates');
        }
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.location-selector-container')) {
        setIsOpen(false);
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="location-selector-container">
      {location ? (
        <div className="selected-location-badge">
          <span className="location-pin">📍</span>
          <span className="location-name" title={location.address}>
            {location.name}{location.city ? `, ${location.city}` : ''}{location.country ? `, ${location.country}` : ''}
          </span>
          <button 
            type="button" 
            className="clear-location-btn" 
            onClick={() => setLocation(null)}
            title="Remove location"
          >
            &times;
          </button>
        </div>
      ) : (
        <div className="add-location-trigger-wrapper">
          <button 
            type="button" 
            className="add-location-trigger-btn"
            onClick={() => {
              setIsOpen(!isOpen);
              setTimeout(() => {
                if (searchInputRef.current) searchInputRef.current.focus();
              }, 100);
            }}
          >
            <span className="location-pin">📍</span> Add Location
          </button>
          
          {isOpen && (
            <div className="location-search-dropdown animate-dropdown">
              <div className="location-search-input-wrapper">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search city, town, landmark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="location-search-input"
                />
              </div>

              <div className="location-actions">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="use-current-location-btn"
                  disabled={loading}
                >
                  📡 {loading ? 'Locating...' : 'Use Current Location'}
                </button>
              </div>

              {error && <div className="location-error-msg">{error}</div>}

              <div className="location-suggestions">
                {loading && <div className="location-loading">Searching...</div>}
                
                {!loading && suggestions.map((place) => (
                  <div 
                    key={place.place_id} 
                    className="location-suggestion-item"
                    onClick={() => handleSelectPlace(place)}
                  >
                    <div className="suggestion-icon">📍</div>
                    <div className="suggestion-details">
                      <div className="suggestion-name">
                        {place.display_name.split(',')[0]}
                      </div>
                      <div className="suggestion-address">
                        {place.display_name.split(',').slice(1).join(',').trim()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
