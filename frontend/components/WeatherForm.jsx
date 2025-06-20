import React, { useState, useRef } from 'react';

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '';

export default function WeatherForm({ onSearch, loading, inputValue, setInputValue }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [selected, setSelected] = useState(null);
  const debounceRef = useRef();

  const fetchSuggestions = async (q) => {
    if (!q) return setSuggestions([]);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setShowSuggestions(true);
    setHighlight(-1);
    setSelected(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (suggestion) => {
    setInputValue(suggestion.name + (suggestion.state ? ', ' + suggestion.state : '') + ', ' + suggestion.country);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelected(suggestion);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (selected && selected.lat && selected.lon) {
      onSearch({ city: selected.name, lat: selected.lat, lon: selected.lon });
    } else {
      onSearch({ city: inputValue.trim() });
    }
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && highlight >= 0) {
      handleSelect(suggestions[highlight]);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }} autoComplete="off" className="modern-form">
      <div className="modern-form-row">
        <input
          type="text"
          placeholder="Enter city name"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="modern-input"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="modern-btn"
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 48,
            zIndex: 10,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(79,140,255,0.15)',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            maxHeight: 220,
            overflowY: 'auto',
            animation: 'fadeIn 0.3s',
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={s.lat + '-' + s.lon}
              onMouseDown={() => handleSelect(s)}
              style={{
                padding: '12px 18px',
                background: highlight === i ? '#e6f0ff' : 'transparent',
                cursor: 'pointer',
                fontWeight: highlight === i ? 'bold' : 'normal',
                transition: 'background 0.2s',
              }}
            >
              {s.name}
              {s.state ? `, ${s.state}` : ''}
              {s.country ? `, ${s.country}` : ''}
            </li>
          ))}
        </ul>
      )}
      <style jsx>{`
        .modern-form {
          background: var(--color-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--color-shadow);
          padding: 12px 16px 18px 16px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          position: relative;
        }
        .modern-form-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
        }
        .modern-input {
          flex: 1;
          padding: 14px 18px;
          border-radius: 999px;
          border: 2px solid var(--color-accent);
          outline: none;
          font-size: 1.1rem;
          background: rgba(255,255,255,0.7);
          box-shadow: 0 2px 8px rgba(79,140,255,0.08);
          transition: box-shadow 0.3s, border 0.2s;
          margin-bottom: 0;
        }
        .modern-input:focus {
          border: 2px solid var(--color-accent2);
          box-shadow: 0 0 0 3px #ffe06644;
        }
        .modern-btn {
          padding: 10px 28px;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--color-accent) 60%, var(--color-accent2) 100%);
          color: #fff;
          border: none;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(79,140,255,0.15);
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
        }
        .modern-btn:active {
          transform: scale(0.97);
        }
        .modern-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </form>
  );
} 