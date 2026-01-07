import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { YellowPagesBroker } from '../../src/brokers/yellowpages.js';
import type { BrokerRegistryEntry, NormalizedInput } from '../../src/types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadFixture = (name: string): string => {
  return readFileSync(
    join(__dirname, '../fixtures/yellowpages', name),
    'utf-8'
  );
};

const foundResultHtml = loadFixture('found-result.html');
const noResultsHtml = loadFixture('no-results.html');
const changedLayoutHtml = loadFixture('changed-layout.html');

const mockConfig: BrokerRegistryEntry = {
  id: 'yellowpages',
  name: 'YellowPages',
  regionsSupported: ['US'],
  searchType: 'name_location',
  status: 'active',
  introducedAt: '2026-01-07T00:00:00Z',
  searchUrl: 'https://www.yellowpages.com',
  optOutUrl: 'https://www.yellowpages.com/support',
};

describe('YellowPagesBroker', () => {
  let broker: YellowPagesBroker;

  beforeEach(() => {
    broker = new YellowPagesBroker(mockConfig);
    vi.restoreAllMocks();
  });

  describe('buildSearchUrl', () => {
    it('should build URL with name only', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toContain('https://www.yellowpages.com/search');
      expect(url).toContain('search_terms=John+Smith');
    });

    it('should build URL with location', () => {
      const input: NormalizedInput = {
        fullName: 'John Smith',
        city: 'New York',
        region: 'NY',
      };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toContain('search_terms=John+Smith');
      expect(url).toContain('geo_location_terms=New+York+NY');
    });
  });

  describe('parseResponse', () => {
    it('should parse found result with all fields', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = (broker as any).parseResponse(foundResultHtml, input);
      
      expect(result.found).toBe(true);
      expect(result.brokerId).toBe('yellowpages');
      expect(result.exposedFields).toContain('address');
      expect(result.exposedFields).toContain('phone');
      // YellowPages has limited personal info - primarily business directory
      expect(result.notes).toContain('Limited personal information');
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
  });

  describe('search', () => {
    it('should return error result on fetch failure', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should parse successful response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(foundResultHtml),
      } as Response);
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(true);
      expect(result.exposedFields.length).toBeGreaterThan(0);
    });

    it('should return error result on timeout', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(
        () => new Promise(() => {})
      );
      
      const fastBroker = new YellowPagesBroker(mockConfig);
      (fastBroker as any).timeoutMs = 50;
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await fastBroker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toContain('Timeout');
    });
  });
});

