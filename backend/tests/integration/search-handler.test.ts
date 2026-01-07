import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../../src/handlers/search.js';

// Mock all broker fetches
vi.mock('../../src/brokers/whitepages.js', () => ({
  WhitepagesBroker: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue({
      brokerId: 'whitepages',
      brokerName: 'Whitepages',
      found: true,
      exposedFields: ['address', 'phone'],
      publicUrl: 'https://whitepages.com/person/123',
      riskLevel: 'medium',
    }),
  })),
}));

vi.mock('../../src/brokers/spokeo.js', () => ({
  SpokeoBroker: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue({
      brokerId: 'spokeo',
      brokerName: 'Spokeo',
      found: false,
      exposedFields: [],
      riskLevel: 'low',
    }),
  })),
}));

vi.mock('../../src/brokers/mylife.js', () => ({
  MyLifeBroker: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue({
      brokerId: 'mylife',
      brokerName: 'MyLife',
      found: true,
      exposedFields: ['reputation score'],
      riskLevel: 'low',
    }),
  })),
}));

vi.mock('../../src/brokers/beenverified.js', () => ({
  BeenVerifiedBroker: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue({
      brokerId: 'beenverified',
      brokerName: 'BeenVerified',
      found: false,
      exposedFields: [],
      riskLevel: 'low',
    }),
  })),
}));

vi.mock('../../src/brokers/peoplefinder.js', () => ({
  PeopleFinderBroker: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue({
      brokerId: 'peoplefinder',
      brokerName: 'PeopleFinder',
      found: true,
      exposedFields: ['address'],
      riskLevel: 'medium',
    }),
  })),
}));

function createEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'POST /api/search',
    rawPath: '/api/search',
    rawQueryString: '',
    headers: {
      'content-type': 'application/json',
    },
    requestContext: {
      accountId: '123456789',
      apiId: 'api123',
      domainName: 'api.whofound.me',
      domainPrefix: 'api',
      http: {
        method: 'POST',
        path: '/api/search',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'test',
      },
      requestId: 'req123',
      routeKey: 'POST /api/search',
      stage: '$default',
      time: '2026-01-07T00:00:00Z',
      timeEpoch: 1767744000000,
    },
    body: JSON.stringify({ fullName: 'John Smith' }),
    isBase64Encoded: false,
    ...overrides,
  } as APIGatewayProxyEventV2;
}

describe('Search Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HTTP method validation', () => {
    it('should reject non-POST requests', async () => {
      const event = createEvent({
        requestContext: {
          ...createEvent().requestContext,
          http: {
            ...createEvent().requestContext.http,
            method: 'GET',
          },
        },
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(405);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Method not allowed');
    });
  });

  describe('Request body validation', () => {
    it('should reject missing body', async () => {
      const event = createEvent({ body: undefined });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
    });

    it('should reject invalid JSON', async () => {
      const event = createEvent({ body: 'not json' });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.error).toBe('Invalid request body');
    });

    it('should reject missing fullName', async () => {
      const event = createEvent({ body: JSON.stringify({}) });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.error).toBe('Full name is required');
    });

    it('should reject non-string fullName', async () => {
      const event = createEvent({ body: JSON.stringify({ fullName: 123 }) });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
    });
  });

  describe('Successful search', () => {
    it('should return exposure report on valid request', async () => {
      const event = createEvent();

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(true);
      expect(body.report).toBeDefined();
      expect(body.report.results).toBeInstanceOf(Array);
      expect(body.report.queryHash).toHaveLength(64);
      expect(body.report.timestamp).toBeDefined();
    });

    it('should include results from all brokers', async () => {
      const event = createEvent();

      const result = await handler(event);
      const body = JSON.parse(result.body as string);

      expect(body.report.results).toHaveLength(5);
      const brokerIds = body.report.results.map((r: any) => r.brokerId);
      expect(brokerIds).toContain('whitepages');
      expect(brokerIds).toContain('spokeo');
      expect(brokerIds).toContain('mylife');
      expect(brokerIds).toContain('beenverified');
      expect(brokerIds).toContain('peoplefinder');
    });

    it('should handle optional city and region', async () => {
      const event = createEvent({
        body: JSON.stringify({
          fullName: 'John Smith',
          city: 'New York',
          region: 'NY',
        }),
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
    });

    it('should handle base64 encoded body', async () => {
      const event = createEvent({
        body: Buffer.from(JSON.stringify({ fullName: 'John Smith' })).toString('base64'),
        isBase64Encoded: true,
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
    });
  });

  describe('Response headers', () => {
    it('should include security headers', async () => {
      const event = createEvent();

      const result = await handler(event);

      expect(result.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        })
      );
    });
  });

  describe('Input validation errors', () => {
    it('should reject single word names', async () => {
      const event = createEvent({
        body: JSON.stringify({ fullName: 'John' }),
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.error).toContain('at least two words');
    });
  });
});

