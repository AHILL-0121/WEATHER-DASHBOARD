import Head from 'next/head';

const SITE_NAME = 'Weather Dashboard';
const DESCRIPTION =
  'Current weather for any city or any point on the map: temperature, wind, humidity, pressure, visibility and sunrise/sunset.';
// Absolute URL for social previews; set at build time in next.config.js
const SITE_URL = process.env.SITE_URL ?? '';

// Title follows the loaded weather, e.g. "12° Clouds in London · Weather Dashboard"
export default function PageHead({ weather }) {
  const title =
    weather && Number.isFinite(weather.temp)
      ? `${Math.round(weather.temp)}° ${weather.condition}${weather.city ? ` in ${weather.city}` : ''} · ${SITE_NAME}`
      : SITE_NAME;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={DESCRIPTION} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={SITE_NAME} />
      <meta property="og:description" content={DESCRIPTION} />
      <meta property="og:image" content={`${SITE_URL}/og.jpg`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Weather Dashboard: search by city or map" />
      {SITE_URL && <meta property="og:url" content={SITE_URL} />}
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
}
