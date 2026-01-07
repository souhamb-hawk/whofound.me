import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WhitepagesBroker } from '../../src/brokers/whitepages.js';
import type { BrokerRegistryEntry, NormalizedInput } from '../../src/types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load fixtures
const loadFixture = (name: string): string => {
  return readFileSync(
    join(__dirname, '../fixtures/whitepages', name),
    'utf-8'
  );
};

const foundResultHtml = loadFixture('found-result.html');
const noResultsHtml = loadFixture('no-results.html');
const partialMatchHtml = loadFixture('partial-match.html');
const changedLayoutHtml = loadFixture('changed-layout.html');

// Mock broker config
const mockConfig: BrokerRegistryEntry = {
  id: 'whitepages',
  name: 'Whitepages',
  regionsSupported: ['US'],
  searchType: 'html',
  status: 'active',
  introducedAt: '2026-01-07T00:00:00Z',
  searchUrl: 'https://www.whitepages.com/name',
  optOutUrl: 'https://www.whitepages.com/suppression-requests',
  notes: 'Primary US people search directory',
};

describe('WhitepagesBroker', () => {
  let broker: WhitepagesBroker;

  beforeEach(() => {
    broker = new WhitepagesBroker(mockConfig);
    vi.restoreAllMocks();
  });

  describe('buildSearchUrl', () => {
    it('should build URL with name only', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      
      // Access protected method via any cast for testing
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toBe('https://www.whitepages.com/name/John-Smith');
    });

    it('should build URL with name and location', () => {
      const input: NormalizedInput = {
        fullName: 'John Smith',
        city: 'New York',
        region: 'NY',
      };
      
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toBe('https://www.whitepages.com/name/John-Smith/New%20York-NY');
    });

    it('should handle multi-word names', () => {
      const input: NormalizedInput = { fullName: 'Mary Jane Watson' };
      
      const url = (broker as any).buildSearchUrl(input);
      
      expect(url).toBe('https://www.whitepages.com/name/Mary-Jane-Watson');
    });
  });

  describe('parseResponse', () => {
    it('should parse found result with all fields', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      
      const result = (broker as any).parseResponse(foundResultHtml, input);
      
      expect(result.found).toBe(true);
      expect(result.brokerId).toBe('whitepages');
      expect(result.brokerName).toBe('Whitepages');
      expect(result.exposedFields).toContain('address');
      expect(result.exposedFields).toContain('phone');
      expect(result.exposedFields).toContain('age');
      expect(result.exposedFields).toContain('relatives');
      expect(result.publicUrl).toBe('https://www.whitepages.com/person/John-Smith.abc123');
      expect(result.riskLevel).toBe('medium'); // Has phone and relatives
    });

    it('should parse no results page', () => {
      const input: NormalizedInput = { fullName: 'Nonexistent Person' };
      
      const result = (broker as any).parseResponse(noResultsHtml, input);
      
      expect(result.found).toBe(false);
      expect(result.exposedFields).toEqual([]);
      expect(result.publicUrl).toBeUndefined();
    });

    it('should detect partial match and add note', () => {
      const input: NormalizedInput = { fullName: 'John Smith' };
      
      const result = (broker as any).parseResponse(partialMatchHtml, input);
      
      expect(result.found).toBe(true);
      expect(result.notes).toBe('Partial match - verify manually');
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
      // Mock fetch to fail
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await broker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.notes).toContain('Check failed');
    });

    it('should return error result on timeout', async () => {
      // Mock fetch to hang
      vi.spyOn(global, 'fetch').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      // Create broker with very short timeout
      const fastBroker = new WhitepagesBroker(mockConfig);
      (fastBroker as any).timeoutMs = 50;
      
      const input: NormalizedInput = { fullName: 'John Smith' };
      const result = await fastBroker.search(input);
      
      expect(result.found).toBe(false);
      expect(result.error).toContain('Timeout');
    });

    it('should return error result on HTTP error', async () => {
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
  });

  describe('calculateRiskLevel', () => {
    it('should return high for criminal/arrest fields', () => {
      const result = (broker as any).calculateRiskLevel(['criminal records', 'arrest history']);
      expect(result).toBe('high');
    });

    it('should return medium for phone/email/relatives', () => {
      const result = (broker as any).calculateRiskLevel(['phone', 'relatives']);
      expect(result).toBe('medium');
    });

    it('should return low for basic fields only', () => {
      const result = (broker as any).calculateRiskLevel(['name', 'city']);
      expect(result).toBe('low');
    });

    it('should return low for empty fields', () => {
      const result = (broker as any).calculateRiskLevel([]);
      expect(result).toBe('low');
    });
  });
});

