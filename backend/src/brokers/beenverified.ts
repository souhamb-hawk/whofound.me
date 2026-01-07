import * as cheerio from 'cheerio';
import type { NormalizedInput, BrokerResult, BrokerRegistryEntry } from '../types/index.js';
import { BaseBroker } from './base.js';

/**
 * BeenVerified broker integration
 * Searches beenverified.com for public listings
 */
export class BeenVerifiedBroker extends BaseBroker {
  constructor(config: BrokerRegistryEntry) {
    super(config);
  }

  protected async executeSearch(input: NormalizedInput): Promise<BrokerResult> {
    const url = this.buildSearchUrl(input);
    const html = await this.fetchHtml(url);
    return this.parseResponse(html, input);
  }

  protected buildSearchUrl(input: NormalizedInput): string {
    // Format: https://www.beenverified.com/f/search/name?fn=First&ln=Last
    const nameParts = input.fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const params = new URLSearchParams({
      fn: firstName,
      ln: lastName,
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
    const resultCards = $('.search-result, .person-card, [data-result-id]');
    
    if (resultCards.length === 0) {
      const noResults = $('.no-results, .empty-state, .not-found').length > 0;
      if (noResults) {
        return this.createNotFoundResult();
      }
      
      return {
        ...this.createNotFoundResult(),
        notes: 'Unable to parse response - page structure may have changed',
      };
    }

    // BeenVerified exposes various background check data
    const exposedFields: string[] = [];
    
    if ($('.address, .location, .current-address').length > 0) {
      exposedFields.push('address');
    }
    
    if ($('.phone, .phone-number').length > 0) {
      exposedFields.push('phone');
    }
    
    if ($('.email, .email-address').length > 0) {
      exposedFields.push('email');
    }
    
    if ($('.age, .dob').length > 0) {
      exposedFields.push('age');
    }
    
    if ($('.relatives, .related-people').length > 0) {
      exposedFields.push('relatives');
    }
    
    if ($('.associates, .known-associates').length > 0) {
      exposedFields.push('associates');
    }
    
    if ($('.criminal, .court-records').length > 0) {
      exposedFields.push('court records');
    }
    
    if ($('.property, .assets').length > 0) {
      exposedFields.push('property records');
    }

    // Get profile URL
    const firstResult = resultCards.first();
    const profileLink = firstResult.find('a').attr('href');
    const publicUrl = profileLink?.startsWith('http')
      ? profileLink
      : profileLink ? `https://www.beenverified.com${profileLink}` : undefined;

    return this.createFoundResult(exposedFields, publicUrl);
  }
}

