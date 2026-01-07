/**
 * Normalized input for broker searches
 * All inputs are trimmed, whitespace-collapsed, and case-normalized
 */
export interface NormalizedInput {
  /** Full name (minimum 2 tokens, e.g., "John Smith") */
  fullName: string;
  /** Optional city for location filtering */
  city?: string;
  /** Optional state/region for location filtering */
  region?: string;
}

/**
 * Result from a single broker search
 */
export interface BrokerResult {
  /** Unique broker identifier (matches registry) */
  brokerId: string;
  /** Human-readable broker name */
  brokerName: string;
  /** Whether a matching profile was found */
  found: boolean;
  /** Categories of data exposed (e.g., "address", "phone", "relatives") */
  exposedFields: string[];
  /** Direct link to the public listing, if available */
  publicUrl?: string;
  /** Risk assessment based on data exposure */
  riskLevel: 'low' | 'medium' | 'high';
  /** Optional notes (e.g., parsing issues, partial match) */
  notes?: string;
  /** Error message if the broker check failed */
  error?: string;
}

/**
 * Complete exposure report aggregating all broker results
 */
export interface ExposureReport {
  /** SHA-256 hash of query (for correlation only, discarded after response) */
  queryHash: string;
  /** ISO 8601 timestamp of the report */
  timestamp: string;
  /** Results from each broker */
  results: BrokerResult[];
}

/**
 * Broker registry entry (from brokers.registry.json)
 */
export interface BrokerRegistryEntry {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Supported regions (e.g., ["US", "EU"]) */
  regionsSupported: string[];
  /** Category of broker */
  category?: 'people_search' | 'background_check' | 'image_search' | 'directory';
  /** Search mechanism type */
  searchType: string;
  /** Confidence level of results */
  confidenceLevel?: 'low' | 'medium' | 'high';
  /** Current status */
  status: 'active' | 'paused' | 'deprecated';
  /** ISO 8601 date when broker was added */
  introducedAt: string;
  /** Search URL pattern */
  searchUrl: string;
  /** Opt-out URL for users */
  optOutUrl: string;
  /** Optional notes */
  notes?: string;
}

/**
 * Broker registry file structure
 */
export interface BrokerRegistry {
  /** Registry version */
  version: string;
  /** Last update timestamp */
  lastUpdated: string;
  /** List of registered brokers */
  brokers: BrokerRegistryEntry[];
}

/**
 * Interface that all broker modules must implement
 */
export interface BrokerModule {
  /** Search for a person on this broker */
  search(input: NormalizedInput): Promise<BrokerResult>;
}

/**
 * API Gateway request body
 */
export interface SearchRequest {
  /** Full name to search */
  fullName: string;
  /** Optional city */
  city?: string;
  /** Optional state/region */
  region?: string;
}

/**
 * API Gateway response body
 */
export interface SearchResponse {
  /** Success indicator */
  success: boolean;
  /** Exposure report (on success) */
  report?: ExposureReport;
  /** Error message (on failure) */
  error?: string;
}

