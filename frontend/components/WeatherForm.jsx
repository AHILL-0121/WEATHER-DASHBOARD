import React, { useState, useRef, useEffect } from 'react';

export default function WeatherForm({ onSearch, loading, inputValue, setInputValue }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]         = useState(false);
  const [highlight, setHighlight]     = useState(-1);
  const [selected, setSelected]       = useState(null);
  const debounce = useRef();
  const request  = useRef(null);

  useEffect(() => () => {
    clearTimeout(debounce.current);
    request.current?.abort();
  }, []);

  // Each keystroke cancels the previous lookup, so an older, slower
  // response can never replace the current suggestions
  const fetchSuggestions = async (q) => {
    request.current?.abort();
    const query = q.trim();
    if (query.length < 2) return setSuggestions([]);

    const controller = new AbortController();
    request.current = controller;
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      const data = res.ok ? await res.json() : [];
      if (!controller.signal.aborted) setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== 'AbortError') setSuggestions([]);
    }
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
    if (Number.isFinite(selected?.lat) && Number.isFinite(selected?.lon)) onSearch({ city: selected.name, lat: selected.lat, lon: selected.lon });
    else onSearch({ city: inputValue.trim() });
    setShowSug(false);
  };

  const handleKeyDown = (e) => {
    if (!showSug || !suggestions.length) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSug(false);
      setHighlight(-1);
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => (h + 1) % suggestions.length); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlight(h => (h - 1 + suggestions.length) % suggestions.length); }
    // Enter on a highlighted suggestion picks it and searches in one step
    if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      const s = suggestions[highlight];
      handleSelect(s);
      onSearch({ city: s.name, lat: s.lat, lon: s.lon });
    }
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
            />
          </div>
          {/* A new search while one is loading cancels the old one, so only an empty input disables this */}
          <button type="submit" className="search-btn" disabled={!inputValue.trim()}>
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

