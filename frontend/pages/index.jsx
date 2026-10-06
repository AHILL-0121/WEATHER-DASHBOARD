import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageHead from '../components/PageHead';
import ErrorBoundary from '../components/ErrorBoundary';
import WeatherForm from '../components/WeatherForm';
import WeatherDisplay from '../components/WeatherDisplay';
import NightStars from '../components/scenes/NightStars';
import SceneFX from '../components/scenes/SceneFX';
import useNow from '../hooks/useNow';
import useWeather from '../hooks/useWeather';
import { getScene, ALL_SCENES } from '../lib/scene';
import { isNightAt } from '../lib/time';

const WeatherMap = dynamic(() => import('../components/WeatherMap'), { ssr: false });

const MAP_FALLBACK = (
  <div className="glass-panel map-panel" role="alert" style={{ padding: 22 }}>
    The map couldn&apos;t be loaded. Search by city name above instead.
  </div>
);

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const { weather, loading, error, search, searchPoint } = useWeather({ onPlaceLabel: setInputValue });

  const scene = getScene(weather?.condition);

  // Re-evaluated every minute so the theme flips when the sun sets with the tab open
  const now = useNow();
  const isNight = useMemo(() => isNightAt(weather, now), [weather, now]);

  // Apply night + scene classes to <body> so CSS vars cascade to all children
  useEffect(() => {
    document.body.classList.toggle('night', isNight);
    ALL_SCENES.forEach((s) => document.body.classList.remove(`scene-${s}`));
    document.body.classList.add(`scene-${scene}`);
    return () => {
      document.body.classList.remove('night');
      ALL_SCENES.forEach((s) => document.body.classList.remove(`scene-${s}`));
    };
  }, [isNight, scene]);

  return (
    <>
      <PageHead weather={weather} />

      {/* Background scene */}
      <div className={`scene scene-${scene}`} />
      <div className="orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>
      {/* Decorative only: a crash here must not take the dashboard down */}
      <ErrorBoundary name="Background scene">
        {isNight && <NightStars />}
        <SceneFX scene={scene} isNight={isNight} />
      </ErrorBoundary>

      {/* Dashboard */}
      <div className="app-wrapper">
        <div className="dashboard-container">
          <Header />

          <WeatherForm
            onSearch={search}
            loading={loading}
            inputValue={inputValue}
            setInputValue={setInputValue}
          />

          {error && (
            <div className="error-banner glass-panel" role="alert">
              <i className="fas fa-triangle-exclamation" aria-hidden="true" />
              {error}
            </div>
          )}

          <WeatherDisplay weather={weather} loading={loading} />

          <ErrorBoundary name="Map" fallback={MAP_FALLBACK}>
            <WeatherMap
              lat={weather?.lat ?? 20}
              lon={weather?.lon ?? 0}
              city={weather?.city ?? ''}
              condition={weather?.condition ?? ''}
              temp={weather?.temp ?? null}
              onMapClick={searchPoint}
            />
          </ErrorBoundary>

          <Footer />
        </div>
      </div>
    </>
  );
}
