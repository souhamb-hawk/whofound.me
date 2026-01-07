import * as cheerio from 'cheerio';
import type { NormalizedInput, BrokerResult, BrokerRegistryEntry } from '../types/index.js';
import { BaseBroker } from './base.js';

/**
 * MyLife broker integration
 * Searches mylife.com for public listings and reputation scores
 */
export class MyLifeBroker extends BaseBroker {
  constructor(config: BrokerRegistryEntry) {
    super(config);
  }

  protected async executeSearch(input: NormalizedInput): Promise<BrokerResult> {
    const url = this.buildSearchUrl(input);
    const html = await this.fetchHtml(url);
    return this.parseResponse(html, input);
  }

  protected buildSearchUrl(input: NormalizedInput): string {
    // Format: https://www.mylife.com/pub-search?fn=First&ln=Last&city=City&state=ST
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
    
    // Look for person results
    const resultCards = $('.person-result, .search-result, [data-person-id]');
    
    if (resultCards.length === 0) {
      const noResults = $('.no-results, .empty-results').length > 0;
      if (noResults) {
        return this.createNotFoundResult();
      }
      
      return {
        ...this.createNotFoundResult(),
        notes: 'Unable to parse response - page structure may have changed',
      };
    }

    // MyLife exposes reputation scores and background info
    const exposedFields: string[] = [];
    
    if ($('.reputation-score, .score').length > 0) {
      exposedFields.push('reputation score');
    }
    
    if ($('.address, .location').length > 0) {
      exposedFields.push('address');
    }
    
    if ($('.age, .birthday').length > 0) {
      exposedFields.push('age');
    }
    
    if ($('.background-info, .criminal').length > 0) {
      exposedFields.push('background info');
    }
    
    if ($('.relatives, .family').length > 0) {
      exposedFields.push('relatives');
    }
    
    if ($('.education, .school').length > 0) {
      exposedFields.push('education');
    }
    
    if ($('.employment, .work').length > 0) {
      exposedFields.push('employment');
    }

    // Get profile URL
    const firstResult = resultCards.first();
    const profileLink = firstResult.find('a').attr('href');
    const publicUrl = profileLink?.startsWith('http')
      ? profileLink
      : profileLink ? `https://www.mylife.com${profileLink}` : undefined;

    return this.createFoundResult(exposedFields, publicUrl);
  }
}

