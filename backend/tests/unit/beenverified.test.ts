import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BeenVerifiedBroker } from '../../src/brokers/beenverified.js';
import type { BrokerRegistryEntry, NormalizedInput } from '../../src/types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadFixture = (name: string): string => {
  return readFileSync(
    join(__dirname, '../fixtures/beenverified', name),
    'utf-8'
  );
};

const foundResultHtml = loadFixture('found-result.html');
const noResultsHtml = loadFixture('no-results.html');
const changedLayoutHtml = loadFixture('changed-layout.html');

const mockConfig: BrokerRegistryEntry = {
  id: 'beenverified',
  name: 'BeenVerified',
  regionsSupported: ['US'],
  searchType: 'html',
  status: 'active',
  introducedAt: '2026-01-07T00:00:00Z',
  searchUrl: 'https://www.beenverified.com/f/search/name',
  optOutUrl: 'https://www.beenverified.com/f/optout/search',
};

describe('BeenVerifiedBroker', () => {
  let broker: BeenVerifiedBroker;

  beforeEach(() => {
    broker = new BeenVerifiedBroker(mockConfig);
    vi.restoreAllMocks();
  });

  describe('buildSearchUrl', () => {
    it('should build URL with first and last name', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toContain('https://www.beenverified.com/f/search/name');
      expect(url).toContain('fn=John');
      expect(url).toContain('ln=Smith');
    });

    it('should include location parameters', () => {
      const input: NormalizedInput = {
        fullName: 'John Smith',
        city: 'Miami',
        region: 'FL',
      };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toContain('city=Miami');
      expect(url).toContain('state=FL');
    });
  });

  describe('parseResponse', () => {
    it('should parse found result with all fields', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = (broker as any).parseResponse(foundResultHtml, input);
      
      expect(result.found).toBe(true);
      expect(result.brokerId).toBe('beenverified');
      expect(result.exposedFields).toContain('address');
      expect(result.exposedFields).toContain('phone');
      expect(result.exposedFields).toContain('email');
      expect(result.exposedFields).toContain('age');
      expect(result.exposedFields).toContain('relatives');
      expect(result.exposedFields).toContain('associates');
      expect(result.exposedFields).toContain('court records');
      expect(result.exposedFields).toContain('property records');
      expect(result.riskLevel).toBe('high'); // Has court records
    });

    it('should parse no results page', () => {
      const input: NormalizedInput = { fullName: 'Nonexistent Person' };
      const result = (broker as any).parseResponse(noResultsHtml, input);
      
      expect(result.found).toBe(false);
      expect(result.exposedFields).toEqual([]);
    });

    it('should handle changed layout gracefully', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = (broker as any).parseResponse(changedLayoutHtml, input);
      
      expect(result.found).toBe(false);
      expect(result.notes).toContain('Unable to parse response');
    });

    it('should return high risk for court records exposure', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = (broker as any).parseResponse(foundResultHtml, input);
      
      expect(result.riskLevel).toBe('high');
    });
  });

  describe('search', () => {
    it('should return error result on fetch failure', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('DNS resolution failed'));
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toBe('DNS resolution failed');
    });

    it('should parse successful response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(foundResultHtml),
      } as Response);
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(true);
      expect(result.exposedFields).toContain('court records');
    });

    it('should return error on HTTP 429', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response);
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toContain('429');
    });
  });
});

