import * as cheerio from 'cheerio';
import type { NormalizedInput, BrokerResult, BrokerRegistryEntry } from '../types/index.js';
import { BaseBroker } from './base.js';

/**
 * Whitepages broker integration
 * Searches whitepages.com for public listings
 */
export class WhitepagesBroker extends BaseBroker {
  constructor(config: BrokerRegistryEntry) {
    super(config);
  }

  protected async executeSearch(input: NormalizedInput): Promise<BrokerResult> {
    const url = this.buildSearchUrl(input);
    const html = await this.fetchHtml(url);
    return this.parseResponse(html, input);
  }

  protected buildSearchUrl(input: NormalizedInput): string {
    // Format: https://www.whitepages.com/name/First-Last/City-ST
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
    
    // Look for person cards/results
    const personCards = $('[data-testid="person-card"], .person-card, .serp-card');
    
    if (personCards.length === 0) {
      // Check for "no results" indicators
      const noResults = $('.no-results, [data-testid="no-results"]').length > 0;
      if (noResults) {
        return this.createNotFoundResult();
      }
      
      // If we can't parse the page, return with a note
      return {
        ...this.createNotFoundResult(),
        notes: 'Unable to parse response - page structure may have changed',
      };
    }

    // Extract exposed data fields
    const exposedFields: string[] = [];
    
    // Check for address
    if ($('.address, [data-testid="address"]').length > 0) {
      exposedFields.push('address');
    }
    
    // Check for phone
    if ($('.phone, [data-testid="phone"]').length > 0) {
      exposedFields.push('phone');
    }
    
    // Check for age/DOB
    if ($('.age, [data-testid="age"]').length > 0) {
      exposedFields.push('age');
    }
    
    // Check for relatives/associates
    if ($('.relatives, .associates, [data-testid="relatives"]').length > 0) {
      exposedFields.push('relatives');
    }

    // Get the first result URL if available
    const firstCard = personCards.first();
    const profileLink = firstCard.find('a[href*="/person/"]').attr('href');
    const publicUrl = profileLink 
      ? `https://www.whitepages.com${profileLink}`
      : undefined;

    // Check if name matches (partial match detection)
    const resultName = firstCard.find('.name, [data-testid="name"]').text().toLowerCase();
    const inputNameLower = input.fullName.toLowerCase();
    const isExactMatch = resultName.includes(inputNameLower) || 
      inputNameLower.split(' ').every(part => resultName.includes(part));

    return this.createFoundResult(
      exposedFields,
      publicUrl,
      isExactMatch ? undefined : 'Partial match - verify manually'
    );
  }
}

