import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type { SearchRequest, SearchResponse, ExposureReport } from '../types/index.js';
import { normalizeInput, hashQuery } from '../utils/normalize.js';
import { searchAllBrokers, browserManager } from '../brokers/index.js';

/**
 * Lambda handler for the search endpoint
 * Processes search requests and returns aggregated broker results
 * 
 * Privacy guarantees:
 * - No logging of request body or personal data
 * - All processing is in-memory only
 * - Query hash is discarded after response
 */
export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // Only allow POST requests
  if (event.requestContext.http.method !== 'POST') {
    return createResponse(405, {
      success: false,
      error: 'Method not allowed',
    });
  }

  // Parse request body
  let request: SearchRequest;
  try {
    if (!event.body) {
      throw new Error('Request body is required');
    }
    request = JSON.parse(event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body
    );
  } catch {
    return createResponse(400, {
      success: false,
      error: 'Invalid request body',
    });
  }

  // Validate required fields
  if (!request.fullName || typeof request.fullName !== 'string') {
    return createResponse(400, {
      success: false,
      error: 'Full name is required',
    });
  }

  try {
    // Normalize input
    const normalizedInput = normalizeInput(request);

    // Generate query hash (for correlation only, discarded after response)
    const queryHash = await hashQuery(normalizedInput);

    // Search all active brokers
    const results = await searchAllBrokers(normalizedInput);

    // Build exposure report
    const report: ExposureReport = {
      queryHash,
      timestamp: new Date().toISOString(),
      results,
    };

    return createResponse(200, {
      success: true,
      report,
    });
  } catch (error) {
    // Return generic error (no personal data in error message)
    const message = error instanceof Error ? error.message : 'Search failed';
    return createResponse(400, {
      success: false,
      error: message,
    });
  } finally {
    // Close browser to free resources
    // This runs after every invocation to prevent memory leaks
    await browserManager.close().catch(() => {
      // Ignore close errors
    });
  }
}

/**
 * Create a standardized API Gateway response
 */
function createResponse(
  statusCode: number,
  body: SearchResponse
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
    body: JSON.stringify(body),
  };
}

