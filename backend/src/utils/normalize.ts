import type { NormalizedInput, SearchRequest } from '../types/index.js';

/**
 * Normalizes user input for consistent broker searches
 * - Trims whitespace
 * - Collapses multiple spaces to single space
 * - Converts to lowercase for matching (preserves original for display)
 */
export function normalizeInput(request: SearchRequest): NormalizedInput {
  const fullName = normalizeString(request.fullName);
  
  if (!fullName || fullName.split(/\s+/).length < 2) {
    throw new Error('Full name must contain at least two words (first and last name)');
  }

  return {
    fullName,
    city: request.city ? normalizeString(request.city) : undefined,
    region: request.region ? normalizeString(request.region) : undefined,
  };
}

/**
 * Normalize a single string value
 * - Trim leading/trailing whitespace
 * - Collapse multiple spaces to single space
 * - Return empty string as undefined
 */
function normalizeString(value: string | undefined): string {
  if (!value) return '';
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Generate a SHA-256 hash of the query for correlation
 * Hash is used only in-memory and discarded after response
 */
export async function hashQuery(input: NormalizedInput): Promise<string> {
  const data = JSON.stringify({
    fullName: input.fullName.toLowerCase(),
    city: input.city?.toLowerCase(),
    region: input.region?.toLowerCase(),
  });
  
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

