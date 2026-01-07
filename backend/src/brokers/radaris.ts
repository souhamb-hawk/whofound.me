import * as cheerio from 'cheerio';
import type { NormalizedInput, BrokerResult, BrokerRegistryEntry } from '../types/index.js';
import { BrowserBaseBroker } from './browser-base.js';

/**
 * Radaris broker integration
 * Searches radaris.com for public listings using headless browser
 */
export class RadarisBroker extends BrowserBaseBroker {
  constructor(config: BrokerRegistryEntry) {
    super(config);
  }

  protected async executeSearch(input: NormalizedInput): Promise<BrokerResult> {
    const url = this.buildSearchUrl(input);
    const html = await this.fetchHtml(url);
    return this.parseResponse(html, input);
  }

  protected buildSearchUrl(input: NormalizedInput): string {
    // Format: https://radaris.com/p/First/Last/
    const nameParts = input.fullName.split(' ');
    const firstName = encodeURIComponent(nameParts[0] || '');
    const lastName = encodeURIComponent(nameParts.slice(1).join(' ') || '');
    
    let url = `${this.config.searchUrl}/${firstName}/${lastName}/`;
    
    if (input.city && input.region) {
      url += `${encodeURIComponent(input.city)}-${encodeURIComponent(input.region)}/`;
    }
    
    return url;
  }

  protected parseResponse(html: string, _input: NormalizedInput): BrokerResult {
    const $ = cheerio.load(html);
    
    // Look for person results - Radaris specific selectors
    const personCards = $('.person-card, .card-person, [data-person], .search-result, .PersonCard, .person-info');
    
    if (personCards.length === 0) {
      const noResults = $('.no-results, .not-found, .empty').length > 0;
      if (noResults || html.includes('No results found') || html.includes('We couldn\'t find')) {
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

    const exposedFields: string[] = [];
    
    if ($('.address, .location, [data-address], .addr').length > 0 || html.includes('address')) {
      exposedFields.push('address');
    }
    
    if ($('.phone, [data-phone], .tel').length > 0 || html.includes('phone')) {
      exposedFields.push('phone');
    }
    
    if ($('.email, [data-email]').length > 0 || html.includes('email')) {
      exposedFields.push('email');
    }
    
    if ($('.age, .dob, [data-age]').length > 0) {
      exposedFields.push('age');
    }
    
    if ($('.relatives, .family, [data-relatives]').length > 0 || html.includes('relatives')) {
      exposedFields.push('relatives');
    }

    const firstResult = personCards.first();
    const profileLink = firstResult.find('a[href*="/p/"]').attr('href');
    const publicUrl = profileLink?.startsWith('http') 
      ? profileLink 
      : profileLink ? `https://radaris.com${profileLink}` : undefined;

    return this.createFoundResult(exposedFields, publicUrl);
  }
}
