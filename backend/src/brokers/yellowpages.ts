import * as cheerio from 'cheerio';
import type { NormalizedInput, BrokerResult, BrokerRegistryEntry } from '../types/index.js';
import { BaseBroker } from './base.js';

/**
 * YellowPages broker integration
 * Searches yellowpages.com for public listings
 */
export class YellowPagesBroker extends BaseBroker {
  constructor(config: BrokerRegistryEntry) {
    super(config);
  }

  protected async executeSearch(input: NormalizedInput): Promise<BrokerResult> {
    const url = this.buildSearchUrl(input);
    const html = await this.fetchHtml(url);
    return this.parseResponse(html, input);
  }

  protected buildSearchUrl(input: NormalizedInput): string {
    // Format: https://www.yellowpages.com/search?search_terms=name&geo_location_terms=city+state
    const params = new URLSearchParams({
      search_terms: input.fullName,
    });
    
    if (input.city && input.region) {
      params.set('geo_location_terms', `${input.city} ${input.region}`);
    }
    
    return `${this.config.searchUrl}/search?${params.toString()}`;
  }

  protected parseResponse(html: string, _input: NormalizedInput): BrokerResult {
    const $ = cheerio.load(html);
    
    const results = $('.result, .organic, .info-section');
    
    if (results.length === 0) {
      const noResults = $('.no-results, .not-found').length > 0;
      if (noResults || html.includes('No results')) {
        return this.createNotFoundResult();
      }
      
      return {
        ...this.createNotFoundResult(),
        notes: 'Unable to parse response - page structure may have changed',
      };
    }

    const exposedFields: string[] = [];
    
    if ($('.street-address, .address').length > 0) {
      exposedFields.push('address');
    }
    
    if ($('.phone, .primary-phone').length > 0) {
      exposedFields.push('phone');
    }
    
    // YellowPages is primarily business directory, less personal info
    return this.createFoundResult(exposedFields, undefined, 'Limited personal information - primarily business directory');
  }
}

