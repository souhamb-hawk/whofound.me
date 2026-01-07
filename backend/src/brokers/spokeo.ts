import * as cheerio from 'cheerio';
import type { NormalizedInput, BrokerResult, BrokerRegistryEntry } from '../types/index.js';
import { BaseBroker } from './base.js';

/**
 * Spokeo broker integration
 * Searches spokeo.com for public listings
 */
export class SpokeoBroker extends BaseBroker {
  constructor(config: BrokerRegistryEntry) {
    super(config);
  }

  protected async executeSearch(input: NormalizedInput): Promise<BrokerResult> {
    const url = this.buildSearchUrl(input);
    const html = await this.fetchHtml(url);
    return this.parseResponse(html, input);
  }

  protected buildSearchUrl(input: NormalizedInput): string {
    // Format: https://www.spokeo.com/search?q=First+Last&t=name
    const params = new URLSearchParams({
      q: input.fullName,
      t: 'name',
    });

    if (input.city) {
      params.set('city', input.city);
    }
    if (input.region) {
      params.set('state', input.region);
    }

    return `${this.config.searchUrl}?${params.toString()}`;
  }

  protected parseResponse(html: string, input: NormalizedInput): BrokerResult {
    const $ = cheerio.load(html);
    
    // Look for search results
    const resultCards = $('.search-result, .result-card, [data-testid="search-result"]');
    
    if (resultCards.length === 0) {
      // Check for "no results" message
      const noResults = $('.no-results, .empty-state').length > 0;
      if (noResults) {
        return this.createNotFoundResult();
      }
      
      return {
        ...this.createNotFoundResult(),
        notes: 'Unable to parse response - page structure may have changed',
      };
    }

    // Extract exposed data fields from result preview
    const exposedFields: string[] = [];
    
    if ($('.location, .address').length > 0) {
      exposedFields.push('address');
    }
    
    if ($('.phone-number').length > 0) {
      exposedFields.push('phone');
    }
    
    if ($('.email').length > 0) {
      exposedFields.push('email');
    }
    
    if ($('.social-profiles, .social').length > 0) {
      exposedFields.push('social profiles');
    }
    
    if ($('.relatives, .family').length > 0) {
      exposedFields.push('relatives');
    }

    // Get profile URL
    const firstResult = resultCards.first();
    const profileLink = firstResult.find('a').attr('href');
    const publicUrl = profileLink?.startsWith('http') 
      ? profileLink 
      : profileLink ? `https://www.spokeo.com${profileLink}` : undefined;

    return this.createFoundResult(exposedFields, publicUrl);
  }
}

