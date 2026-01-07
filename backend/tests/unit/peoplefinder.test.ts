import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PeopleFinderBroker } from '../../src/brokers/peoplefinder.js';
import type { BrokerRegistryEntry, NormalizedInput } from '../../src/types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadFixture = (name: string): string => {
  return readFileSync(
    join(__dirname, '../fixtures/peoplefinder', name),
    'utf-8'
  );
};

const foundResultHtml = loadFixture('found-result.html');
const noResultsHtml = loadFixture('no-results.html');
const changedLayoutHtml = loadFixture('changed-layout.html');

const mockConfig: BrokerRegistryEntry = {
  id: 'peoplefinder',
  name: 'PeopleFinder',
  regionsSupported: ['US'],
  searchType: 'html',
  status: 'active',
  introducedAt: '2026-01-07T00:00:00Z',
  searchUrl: 'https://www.peoplefinder.com/people',
  optOutUrl: 'https://www.peoplefinder.com/optout',
};

describe('PeopleFinderBroker', () => {
  let broker: PeopleFinderBroker;

  beforeEach(() => {
    broker = new PeopleFinderBroker(mockConfig);
    vi.restoreAllMocks();
  });

  describe('buildSearchUrl', () => {
    it('should build URL with name only', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toBe('https://www.peoplefinder.com/people/John-Smith');
    });

    it('should build URL with location', () => {
      const input: NormalizedInput = {
        fullName: 'John Smith',
        city: 'Seattle',
        region: 'WA',
      };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toBe('https://www.peoplefinder.com/people/John-Smith/Seattle-WA');
    });

    it('should handle multi-word names', () => {
      const input: NormalizedInput = { fullName: 'Mary Jane Watson' };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toBe('https://www.peoplefinder.com/people/Mary-Jane-Watson');
    });
  });

  describe('parseResponse', () => {
    it('should parse found result with all fields', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = (broker as any).parseResponse(foundResultHtml, input);
      
      expect(result.found).toBe(true);
      expect(result.brokerId).toBe('peoplefinder');
      expect(result.exposedFields).toContain('address');
      expect(result.exposedFields).toContain('phone');
      expect(result.exposedFields).toContain('age');
      expect(result.exposedFields).toContain('relatives');
      expect(result.exposedFields).toContain('address history');
      expect(result.publicUrl).toContain('peoplefinder.com');
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

    it('should return medium risk for address/phone exposure', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = (broker as any).parseResponse(foundResultHtml, input);
      
      expect(result.riskLevel).toBe('medium');
    });
  });

  describe('search', () => {
    it('should return error result on fetch failure', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Socket timeout'));
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toBe('Socket timeout');
    });

    it('should parse successful response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(foundResultHtml),
      } as Response);
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(true);
      expect(result.exposedFields).toContain('address history');
    });

    it('should return error on HTTP 500', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toContain('500');
    });

    it('should return error result on timeout', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(
        () => new Promise(() => {})
      );
      
      const fastBroker = new PeopleFinderBroker(mockConfig);
      (fastBroker as any).timeoutMs = 50;
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await fastBroker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toContain('Timeout');
    });
  });
});

