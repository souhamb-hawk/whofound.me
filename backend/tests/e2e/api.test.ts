/**
 * E2E API Tests
 * 
 * These tests validate the full request lifecycle with mocked broker responses.
 * They do NOT hit real broker websites.
 * 
 * Run against deployed preview/staging environment.
 */

import { describe, it, expect, beforeAll } from 'vitest';

// API endpoint - set via environment variable or default to localhost
const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('E2E API Tests', () => {
  beforeAll(() => {
    console.log(`Testing against: ${API_URL}`);
  });

  describe('POST /api/search', () => {
    it('should return 200 for valid search request', async () => {
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: 'John Smith',
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.report).toBeDefined();
      expect(data.report.results).toBeInstanceOf(Array);
      expect(data.report.results.length).toBe(5); // 5 brokers
    });

    it('should return 400 for missing fullName', async () => {
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for single word name', async () => {
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: 'John',
        }),
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should handle optional city and region', async () => {
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: 'John Smith',
          city: 'New York',
          region: 'NY',
        }),
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should include security headers in response', async () => {
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: 'John Smith',
        }),
      });

      expect(response.headers.get('Content-Type')).toContain('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('Method validation', () => {
    it('should return 405 for GET requests', async () => {
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'GET',
      });

      // API Gateway may return 404 or 405 depending on config
      expect([404, 405]).toContain(response.status);
    });
  });
});

