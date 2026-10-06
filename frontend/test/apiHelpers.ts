import { vi, type Mock } from 'vitest';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';

let ipCounter = 0;

type Query = Record<string, string | string[] | undefined>;

interface ReqOptions {
  method?: string;
  ip?: string;
}

export interface MockRes {
  statusCode: number;
  headers: Record<string, string | number | readonly string[]>;
  // Response bodies vary per route and test; assertions narrow them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

// Minimal stand-ins for Next.js API req/res. Each request gets a fresh IP so
// the per-IP rate limit only applies where a test asks for it.
export function mockReq(query: Query = {}, { method = 'GET', ip }: ReqOptions = {}): NextApiRequest {
  ipCounter += 1;
  return {
    method,
    query,
    headers: { 'x-forwarded-for': ip ?? `10.0.0.${ipCounter}` },
    socket: {},
  } as unknown as NextApiRequest;
}

export function mockRes(): MockRes & NextApiResponse {
  // Records what the handler sends; the methods chain like Next's response
  const res = {
    statusCode: 200,
    headers: {} as MockRes['headers'],
    body: undefined as unknown,
    setHeader(k: string, v: string | number | readonly string[]) {
      res.headers[k.toLowerCase()] = v;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res as unknown as MockRes & NextApiResponse;
}

export async function call(handler: NextApiHandler, query: Query, opts?: ReqOptions): Promise<MockRes> {
  const res = mockRes();
  await handler(mockReq(query, opts), res);
  return res;
}

// Replaces global fetch with one that returns `body` with `status`
export function mockUpstream(body: unknown, status = 200): Mock<typeof fetch> {
  // A Response body can be read once, so build a new one per call
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// The URL the route sent to OpenWeather on its nth fetch
export const upstreamUrl = (fetchMock: Mock<typeof fetch>, n = 0): URL =>
  new URL(String(fetchMock.mock.calls[n]![0]));
