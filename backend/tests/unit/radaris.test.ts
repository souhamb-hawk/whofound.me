import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { RadarisBroker } from '../../src/brokers/radaris.js';
import type { BrokerRegistryEntry, NormalizedInput } from '../../src/types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadFixture = (name: string): string => {
  return readFileSync(
    join(__dirname, '../fixtures/radaris', name),
    'utf-8'
  );
};

const foundResultHtml = loadFixture('found-result.html');
const noResultsHtml = loadFixture('no-results.html');
const changedLayoutHtml = loadFixture('changed-layout.html');

const mockConfig: BrokerRegistryEntry = {
  id: 'radaris',
  name: 'Radaris',
  regionsSupported: ['US'],
  searchType: 'name_location',
  status: 'active',
  introducedAt: '2026-01-07T00:00:00Z',
  searchUrl: 'https://radaris.com/p',
  optOutUrl: 'https://radaris.com/control/privacy',
};

describe('RadarisBroker', () => {
  let broker: RadarisBroker;

  beforeEach(() => {
    broker = new RadarisBroker(mockConfig);
    vi.restoreAllMocks();
  });

  describe('buildSearchUrl', () => {
    it('should build URL with name only', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toContain('https://radaris.com/p');
      expect(url).toContain('John');
      expect(url).toContain('Smith');
    });

    it('should build URL with location', () => {
      const input: NormalizedInput = {
        fullName: 'John Smith',
        city: 'New York',
        region: 'NY',
      };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toContain('John');
      expect(url).toContain('Smith');
      expect(url).toContain('New%20York');
      expect(url).toContain('NY');
    });
  });

  describe('parseResponse', () => {
    it('should parse found result with all fields', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = (broker as any).parseResponse(foundResultHtml, input);
      
      expect(result.found).toBe(true);
      expect(result.brokerId).toBe('radaris');
      expect(result.exposedFields).toContain('address');
      expect(result.exposedFields).toContain('phone');
      expect(result.exposedFields).toContain('email');
      expect(result.exposedFields).toContain('age');
      expect(result.exposedFields).toContain('relatives');
      expect(result.publicUrl).toContain('radaris.com');
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
      
      const fastBroker = new RadarisBroker(mockConfig);
      (fastBroker as any).timeoutMs = 50;
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await fastBroker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toContain('Timeout');
    });
  });
});

