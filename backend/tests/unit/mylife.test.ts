import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MyLifeBroker } from '../../src/brokers/mylife.js';
import type { BrokerRegistryEntry, NormalizedInput } from '../../src/types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadFixture = (name: string): string => {
  return readFileSync(
    join(__dirname, '../fixtures/mylife', name),
    'utf-8'
  );
};

const foundResultHtml = loadFixture('found-result.html');
const noResultsHtml = loadFixture('no-results.html');
const changedLayoutHtml = loadFixture('changed-layout.html');

const mockConfig: BrokerRegistryEntry = {
  id: 'mylife',
  name: 'MyLife',
  regionsSupported: ['US'],
  searchType: 'html',
  status: 'active',
  introducedAt: '2026-01-07T00:00:00Z',
  searchUrl: 'https://www.mylife.com/pub-search',
  optOutUrl: 'https://www.mylife.com/ccpa/index.pubview',
};

describe('MyLifeBroker', () => {
  let broker: MyLifeBroker;

  beforeEach(() => {
    broker = new MyLifeBroker(mockConfig);
    vi.restoreAllMocks();
  });

  describe('buildSearchUrl', () => {
    it('should build URL with first and last name', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toContain('https://www.mylife.com/pub-search');
      expect(url).toContain('fn=John');
      expect(url).toContain('ln=Smith');
    });

    it('should handle multi-word last names', () => {
      const input: NormalizedInput = { fullName: 'Mary Jane Watson Parker' };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toContain('fn=Mary');
      expect(url).toContain('ln=Jane+Watson+Parker');
    });

    it('should include location parameters', () => {
      const input: NormalizedInput = {
        fullName: 'John Smith',
        city: 'Chicago',
        region: 'IL',
      };
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toContain('city=Chicago');
      expect(url).toContain('state=IL');
    });
  });

  describe('parseResponse', () => {
    it('should parse found result with all fields', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = (broker as any).parseResponse(foundResultHtml, input);
      
      expect(result.found).toBe(true);
      expect(result.brokerId).toBe('mylife');
      expect(result.exposedFields).toContain('reputation score');
      expect(result.exposedFields).toContain('address');
      expect(result.exposedFields).toContain('age');
      expect(result.exposedFields).toContain('background info');
      expect(result.exposedFields).toContain('relatives');
      expect(result.exposedFields).toContain('education');
      expect(result.exposedFields).toContain('employment');
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
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Connection refused'));
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toBe('Connection refused');
    });

    it('should parse successful response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(foundResultHtml),
      } as Response);
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(true);
      expect(result.exposedFields).toContain('reputation score');
    });

    it('should return error on HTTP 503', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as Response);
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toContain('503');
    });
  });
});

