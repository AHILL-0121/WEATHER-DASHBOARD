const isDev = process.env.NODE_ENV !== 'production';

// Production builds use webpack (`npm run build`): Turbopack's build inlines a
// bootstrap <script> that `script-src 'self'` blocks, so a self-hosted
// `next start` never hydrated. The e2e suite fails on any CSP violation.
//
// Every external origin the browser talks to must be listed here.
const csp = [
  "default-src 'self'",
  `script-src 'self'${isDev ? " 'unsafe-eval' 'unsafe-inline'" : ''}`,
  // React style props and Leaflet's positioning use inline styles
  "style-src 'self' 'unsafe-inline'",
  // Fonts are self-hosted by next/font
  "font-src 'self'",
  // Map tiles (MapTiler) and OpenWeather condition icons
  "img-src 'self' data: blob: https://openweathermap.org https://api.maptiler.com",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

// Absolute site URL for social-preview tags. Set SITE_URL explicitly, or let
// Vercel supply the production domain; falls back to localhost in development.
const siteUrl =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: { SITE_URL: siteUrl.replace(/\/$/, '') },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
