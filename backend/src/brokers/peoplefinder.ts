import * as cheerio from 'cheerio';
import type { NormalizedInput, BrokerResult, BrokerRegistryEntry } from '../types/index.js';
import { BaseBroker } from './base.js';

/**
 * PeopleFinder broker integration
 * Searches peoplefinder.com for public listings
 */
export class PeopleFinderBroker extends BaseBroker {
  constructor(config: BrokerRegistryEntry) {
    super(config);
  }

  protected async executeSearch(input: NormalizedInput): Promise<BrokerResult> {
    const url = this.buildSearchUrl(input);
    const html = await this.fetchHtml(url);
    return this.parseResponse(html, input);
  }

  protected buildSearchUrl(input: NormalizedInput): string {
    // Format: https://www.peoplefinder.com/people/First-Last/City-ST
    const namePart = input.fullName
      .split(' ')
      .map(part => encodeURIComponent(part))
      .join('-');

    let url = `${this.config.searchUrl}/${namePart}`;

    if (input.city && input.region) {
      const locationPart = `${encodeURIComponent(input.city)}-${encodeURIComponent(input.region)}`;
      url += `/${locationPart}`;
    }

    return url;
  }

  protected parseResponse(html: string, input: NormalizedInput): BrokerResult {
    const $ = cheerio.load(html);
    
    // Look for search results
    const resultCards = $('.result-card, .person-result, [data-person]');
    
    if (resultCards.length === 0) {
      const noResults = $('.no-results, .empty-results, .not-found').length > 0;
      if (noResults) {
        return this.createNotFoundResult();
      }
      
      return {
        ...this.createNotFoundResult(),
        notes: 'Unable to parse response - page structure may have changed',
      };
    }

    // Extract exposed data fields
    const exposedFields: string[] = [];
    
    if ($('.address, .location').length > 0) {
      exposedFields.push('address');
    }
    
    if ($('.phone').length > 0) {
      exposedFields.push('phone');
    }
    
    if ($('.age, .birth').length > 0) {
      exposedFields.push('age');
    }
    
    if ($('.relatives, .family').length > 0) {
      exposedFields.push('relatives');
    }
    
    if ($('.previous-addresses, .address-history').length > 0) {
      exposedFields.push('address history');
    }

    // Get profile URL
    const firstResult = resultCards.first();
    const profileLink = firstResult.find('a').attr('href');
    const publicUrl = profileLink?.startsWith('http')
      ? profileLink
      : profileLink ? `https://www.peoplefinder.com${profileLink}` : undefined;

    return this.createFoundResult(exposedFields, publicUrl);
  }
}

