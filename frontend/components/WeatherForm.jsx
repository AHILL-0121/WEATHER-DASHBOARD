import React, { useState, useRef } from 'react';

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';

export default function WeatherForm({ onSearch, loading, inputValue, setInputValue }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]         = useState(false);
  const [highlight, setHighlight]     = useState(-1);
  const [selected, setSelected]       = useState(null);
  const debounce = useRef();

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 2) return setSuggestions([]);
    try {
      const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch { setSuggestions([]); }
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    setShowSug(true);
    setHighlight(-1);
    setSelected(null);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchSuggestions(e.target.value), 280);
  };

  const handleSelect = (s) => {
    setInputValue(s.name + (s.state ? ', ' + s.state : '') + ', ' + s.country);
    setShowSug(false);
    setSuggestions([]);
    setSelected(s);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (selected?.lat && selected?.lon) onSearch({ city: selected.name, lat: selected.lat, lon: selected.lon });
    else onSearch({ city: inputValue.trim() });
    setShowSug(false);
  };

  const handleKeyDown = (e) => {
    if (!showSug || !suggestions.length) return;
    if (e.key === 'ArrowDown')  setHighlight(h => (h + 1) % suggestions.length);
    if (e.key === 'ArrowUp')    setHighlight(h => (h - 1 + suggestions.length) % suggestions.length);
    if (e.key === 'Enter' && highlight >= 0) { e.preventDefault(); handleSelect(suggestions[highlight]); }
  };

  return (
    <div className="search-panel glass-panel">
      <form onSubmit={handleSubmit} autoComplete="off" style={{ position: 'relative' }}>
        <div className="search-wrap">
          <div className="search-input-wrap">
            <i className="fas fa-magnifying-glass search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search a city..."
              value={inputValue}
              onChange={handleChange}
              onFocus={() => setShowSug(true)}
              onBlur={() => setTimeout(() => setShowSug(false), 160)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>
          <button type="submit" className="search-btn" disabled={loading || !inputValue.trim()}>
            {loading
              ? <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 6 }} />Loading</>
              : <><i className="fas fa-location-crosshairs" style={{ marginRight: 6 }} />Search</>}
          </button>
        </div>

        {showSug && suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className={`suggestion-item${i === highlight ? ' active' : ''}`}
                onMouseDown={() => handleSelect(s)}
              >
                <i className="fas fa-location-dot sug-pin" />
                <div>
                  <div className="sug-name">{s.name}</div>
                  <div className="sug-detail">{[s.state, s.country].filter(Boolean).join(', ')}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}

