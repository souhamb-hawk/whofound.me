import type { NormalizedInput, BrokerResult, BrokerModule, BrokerRegistryEntry } from '../types/index.js';

/** Default timeout for broker requests (in milliseconds) */
const DEFAULT_TIMEOUT_MS = 4000;

/**
 * Base class for broker integrations
 * Provides common functionality: timeout enforcement, error handling, result formatting
 */
export abstract class BaseBroker implements BrokerModule {
  protected readonly config: BrokerRegistryEntry;
  protected readonly timeoutMs: number;

  constructor(config: BrokerRegistryEntry, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.config = config;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Search for a person on this broker
   * Wraps the implementation with timeout and error handling
   */
  async search(input: NormalizedInput): Promise<BrokerResult> {
    try {
      const result = await this.withTimeout(
        this.executeSearch(input),
        this.timeoutMs
      );
      return result;
    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  /**
   * Implement the actual search logic in subclasses
   */
  protected abstract executeSearch(input: NormalizedInput): Promise<BrokerResult>;

  /**
   * Build the search URL for this broker
   */
  protected abstract buildSearchUrl(input: NormalizedInput): string;

  /**
   * Parse HTML response and extract profile data
   */
  protected abstract parseResponse(html: string, input: NormalizedInput): BrokerResult;

  /**
   * Fetch HTML from URL with timeout
   */
  protected async fetchHtml(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; whofound.me privacy checker)',
          'Accept': 'text/html',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Wrap a promise with a timeout
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      ),
    ]);
  }

  /**
   * Create a result object for error cases
   */
  protected createErrorResult(error: unknown): BrokerResult {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      brokerId: this.config.id,
      brokerName: this.config.name,
      found: false,
      exposedFields: [],
      riskLevel: 'low',
      error: message,
      notes: 'Check failed - broker may be temporarily unavailable',
    };
  }

  /**
   * Create a "not found" result
   */
  protected createNotFoundResult(): BrokerResult {
    return {
      brokerId: this.config.id,
      brokerName: this.config.name,
      found: false,
      exposedFields: [],
      riskLevel: 'low',
    };
  }

  /**
   * Create a "found" result with exposed fields
   */
  protected createFoundResult(
    exposedFields: string[],
    publicUrl?: string,
    notes?: string
  ): BrokerResult {
    return {
      brokerId: this.config.id,
      brokerName: this.config.name,
      found: true,
      exposedFields,
      publicUrl,
      riskLevel: this.calculateRiskLevel(exposedFields),
      notes,
    };
  }

  /**
   * Calculate risk level based on exposed data types
   */
  protected calculateRiskLevel(exposedFields: string[]): 'low' | 'medium' | 'high' {
    const highRiskFields = ['ssn', 'social security', 'credit', 'criminal', 'arrest', 'court'];
    const mediumRiskFields = ['phone', 'email', 'address', 'relatives', 'associates'];

    const hasHighRisk = exposedFields.some(field =>
      highRiskFields.some(hr => field.toLowerCase().includes(hr))
    );
    if (hasHighRisk) return 'high';

    const hasMediumRisk = exposedFields.some(field =>
      mediumRiskFields.some(mr => field.toLowerCase().includes(mr))
    );
    if (hasMediumRisk) return 'medium';

    return 'low';
  }
}

