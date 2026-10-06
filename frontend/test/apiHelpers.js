import { vi } from 'vitest';

let ipCounter = 0;

// Minimal stand-ins for Next.js API req/res. Each request gets a fresh IP so
// the per-IP rate limit only applies where a test asks for it.
export function mockReq(query = {}, { method = 'GET', ip } = {}) {
  ipCounter += 1;
  return { method, query, headers: { 'x-forwarded-for': ip ?? `10.0.0.${ipCounter}` }, socket: {} };
}

export function mockRes() {
  const res = { statusCode: 200, headers: {}, body: undefined };
  res.setHeader = (k, v) => {
    res.headers[k.toLowerCase()] = v;
    return res;
  };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

export async function call(handler, query, opts) {
  const res = mockRes();
  await handler(mockReq(query, opts), res);
  return res;
}

// Replaces global fetch with one that returns `body` with `status`
export function mockUpstream(body, status = 200) {
  // A Response body can be read once, so build a new one per call
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// The URL the route sent to OpenWeather on its nth fetch
export const upstreamUrl = (fetchMock, n = 0) => new URL(String(fetchMock.mock.calls[n][0]));
