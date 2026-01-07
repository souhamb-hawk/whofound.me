import * as cheerio from 'cheerio';
import type { NormalizedInput, BrokerResult, BrokerRegistryEntry } from '../types/index.js';
import { BrowserBaseBroker } from './browser-base.js';

/**
 * Spokeo broker integration
 * Searches spokeo.com for public listings using headless browser
 */
export class SpokeoBroker extends BrowserBaseBroker {
  constructor(config: BrokerRegistryEntry) {
    super(config);
  }

  protected async executeSearch(input: NormalizedInput): Promise<BrokerResult> {
    const url = this.buildSearchUrl(input);
    const html = await this.fetchHtml(url);
    return this.parseResponse(html, input);
  }

  protected buildSearchUrl(input: NormalizedInput): string {
    // Format: https://www.spokeo.com/John-Smith or with location /John-Smith/New-York-NY
    const namePart = input.fullName.split(' ').join('-');
    let url = `${this.config.searchUrl}/${encodeURIComponent(namePart)}`;
    
    if (input.city && input.region) {
      const locationPart = `${input.city}-${input.region}`.replace(/\s+/g, '-');
      url += `/${encodeURIComponent(locationPart)}`;
    }
    
    return url;
  }

  protected parseResponse(html: string, _input: NormalizedInput): BrokerResult {
    const $ = cheerio.load(html);
    
    // Look for search results - Spokeo specific selectors
    const resultCards = $('.search-result, .result-card, [data-testid="search-result"], .people-result, .result-item');
    
    if (resultCards.length === 0) {
      // Check for "no results" message
      const noResults = $('.no-results, .empty-state').length > 0;
      if (noResults || html.includes('No results') || html.includes('couldn\'t find')) {
        return this.createNotFoundResult();
      }
      
      // Check if we got blocked or hit a captcha
      if (html.includes('captcha') || html.includes('robot') || html.includes('blocked')) {
        return {
          ...this.createNotFoundResult(),
          error: 'Request blocked by site protection',
          notes: 'Site may be blocking automated requests',
        };
      }
      
      return {
        ...this.createNotFoundResult(),
        notes: 'Unable to parse response - page structure may have changed',
      };
    }

    // Extract exposed data fields from result preview
    const exposedFields: string[] = [];
    
    if ($('.location, .address').length > 0 || html.includes('address')) {
      exposedFields.push('address');
    }
    
    if ($('.phone-number, .phone').length > 0 || html.includes('phone')) {
      exposedFields.push('phone');
    }
    
    if ($('.email').length > 0 || html.includes('email')) {
      exposedFields.push('email');
    }
    
    if ($('.social-profiles, .social').length > 0 || html.includes('social')) {
      exposedFields.push('social profiles');
    }
    
    if ($('.relatives, .family').length > 0 || html.includes('relatives')) {
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
