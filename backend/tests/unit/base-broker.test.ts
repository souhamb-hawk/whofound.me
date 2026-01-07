import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseBroker } from '../../src/brokers/base.js';
import type { BrokerRegistryEntry, NormalizedInput, BrokerResult } from '../../src/types/index.js';

// Concrete implementation for testing abstract class
class TestBroker extends BaseBroker {
  public testHtml: string = '';
  public shouldThrow: boolean = false;

  protected async executeSearch(input: NormalizedInput): Promise<BrokerResult> {
    if (this.shouldThrow) {
      throw new Error('Test error');
    }
    const html = await this.fetchHtml(this.buildSearchUrl(input));
    return this.parseResponse(html, input);
  }

  protected buildSearchUrl(input: NormalizedInput): string {
    return `https://test.com/search?q=${encodeURIComponent(input.fullName)}`;
  }

  protected parseResponse(html: string, _input: NormalizedInput): BrokerResult {
    if (html.includes('found')) {
      return this.createFoundResult(['address', 'phone'], 'https://test.com/profile/123');
    }
    return this.createNotFoundResult();
  }

  // Expose protected methods for testing
  public exposedCreateErrorResult(error: unknown) {
    return this.createErrorResult(error);
  }

  public exposedCreateNotFoundResult() {
    return this.createNotFoundResult();
  }

  public exposedCreateFoundResult(
    exposedFields: string[],
    publicUrl?: string,
    notes?: string
  ) {
    return this.createFoundResult(exposedFields, publicUrl, notes);
  }

  public exposedCalculateRiskLevel(exposedFields: string[]) {
    return this.calculateRiskLevel(exposedFields);
  }
}

const mockConfig: BrokerRegistryEntry = {
  id: 'test-broker',
  name: 'Test Broker',
  regionsSupported: ['US'],
  searchType: 'html',
  status: 'active',
  introducedAt: '2026-01-07T00:00:00Z',
  searchUrl: 'https://test.com/search',
  optOutUrl: 'https://test.com/optout',
};

describe('BaseBroker', () => {
  let broker: TestBroker;

  beforeEach(() => {
    broker = new TestBroker(mockConfig);
    vi.restoreAllMocks();
  });

  describe('search', () => {
    it('should return parsed result on success', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('found profile'),
      } as Response);

      const result = await broker.search({ fullName: 'John Smith' });

      expect(result.found).toBe(true);
      expect(result.brokerId).toBe('test-broker');
      expect(result.brokerName).toBe('Test Broker');
    });

    it('should catch and wrap errors', async () => {
      broker.shouldThrow = true;
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('found'),
      } as Response);

      const result = await broker.search({ fullName: 'John Smith' });

      expect(result.found).toBe(false);
      expect(result.error).toBe('Test error');
    });

    it('should timeout long requests', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const fastBroker = new TestBroker(mockConfig);
      (fastBroker as any).timeoutMs = 50;

      const result = await fastBroker.search({ fullName: 'John Smith' });

      expect(result.found).toBe(false);
      expect(result.error).toContain('Timeout');
    });
  });

  describe('createErrorResult', () => {
    it('should create error result from Error object', () => {
      const result = broker.exposedCreateErrorResult(new Error('Something failed'));

      expect(result.found).toBe(false);
      expect(result.error).toBe('Something failed');
      expect(result.brokerId).toBe('test-broker');
      expect(result.notes).toContain('Check failed');
    });

    it('should handle non-Error objects', () => {
      const result = broker.exposedCreateErrorResult('string error');

      expect(result.error).toBe('Unknown error');
    });
  });

  describe('createNotFoundResult', () => {
    it('should create properly structured not-found result', () => {
      const result = broker.exposedCreateNotFoundResult();

      expect(result.found).toBe(false);
      expect(result.exposedFields).toEqual([]);
      expect(result.riskLevel).toBe('low');
      expect(result.brokerId).toBe('test-broker');
      expect(result.brokerName).toBe('Test Broker');
    });
  });

  describe('createFoundResult', () => {
    it('should create found result with all fields', () => {
      const result = broker.exposedCreateFoundResult(
        ['address', 'phone'],
        'https://test.com/profile',
        'Test note'
      );

      expect(result.found).toBe(true);
      expect(result.exposedFields).toEqual(['address', 'phone']);
      expect(result.publicUrl).toBe('https://test.com/profile');
      expect(result.notes).toBe('Test note');
      expect(result.riskLevel).toBe('medium'); // phone is medium risk
    });

    it('should work without optional fields', () => {
      const result = broker.exposedCreateFoundResult(['name']);

      expect(result.found).toBe(true);
      expect(result.publicUrl).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  describe('calculateRiskLevel', () => {
    it('should return high for SSN', () => {
      expect(broker.exposedCalculateRiskLevel(['ssn'])).toBe('high');
    });

    it('should return high for criminal records', () => {
      expect(broker.exposedCalculateRiskLevel(['criminal background'])).toBe('high');
    });

    it('should return high for arrest history', () => {
      expect(broker.exposedCalculateRiskLevel(['arrest records'])).toBe('high');
    });

    it('should return medium for phone', () => {
      expect(broker.exposedCalculateRiskLevel(['phone number'])).toBe('medium');
    });

    it('should return medium for email', () => {
      expect(broker.exposedCalculateRiskLevel(['email'])).toBe('medium');
    });

    it('should return medium for address', () => {
      expect(broker.exposedCalculateRiskLevel(['home address'])).toBe('medium');
    });

    it('should return medium for relatives', () => {
      expect(broker.exposedCalculateRiskLevel(['relatives'])).toBe('medium');
    });

    it('should return low for basic info', () => {
      expect(broker.exposedCalculateRiskLevel(['name', 'city'])).toBe('low');
    });

    it('should return low for empty array', () => {
      expect(broker.exposedCalculateRiskLevel([])).toBe('low');
    });

    it('should prioritize highest risk', () => {
      expect(broker.exposedCalculateRiskLevel(['name', 'phone', 'criminal'])).toBe('high');
    });
  });

  describe('fetchHtml', () => {
    it('should return HTML on successful fetch', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html>content</html>'),
      } as Response);

      const html = await (broker as any).fetchHtml('https://test.com');

      expect(html).toBe('<html>content</html>');
    });

    it('should throw on HTTP error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect((broker as any).fetchHtml('https://test.com')).rejects.toThrow(
        'HTTP 404: Not Found'
      );
    });

    it('should include proper headers', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
      } as Response);

      await (broker as any).fetchHtml('https://test.com');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://test.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('whofound.me'),
            'Accept': 'text/html',
          }),
        })
      );
    });
  });
});

