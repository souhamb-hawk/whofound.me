import type { Page } from 'puppeteer-core';
import type { BrokerRegistryEntry } from '../types/index.js';
import { BaseBroker } from './base.js';
import { browserManager } from './browser-manager.js';

/** Default timeout for browser-based broker requests (in milliseconds) */
const DEFAULT_BROWSER_TIMEOUT_MS = 30000;

/**
 * Browser-based broker base class
 * Extends BaseBroker with Puppeteer support for sites that block simple fetch requests
 */
export abstract class BrowserBaseBroker extends BaseBroker {
  constructor(config: BrokerRegistryEntry, timeoutMs: number = DEFAULT_BROWSER_TIMEOUT_MS) {
    super(config, timeoutMs);
  }

  /**
   * Fetch HTML using headless browser
   * Renders JavaScript and handles dynamic content
   */
  protected async fetchHtmlWithBrowser(url: string): Promise<string> {
    let page: Page | null = null;

    try {
      page = await browserManager.newPage();

      // Navigate to the URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.timeoutMs,
      });

      // Add a small delay to let any JavaScript finish
      await this.randomDelay(500, 1500);

      // Wait for page to be fully loaded
      await this.waitForPageReady(page);

      // Get the rendered HTML
      const html = await page.content();

      return html;
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {
          // Page may already be closed
        }
      }
    }
  }

  /**
   * Fetch HTML with additional interactions (scroll, click, etc.)
   * Useful for pages that load content dynamically
   */
  protected async fetchHtmlWithInteraction(
    url: string,
    interactions?: PageInteractions
  ): Promise<string> {
    let page: Page | null = null;

    try {
      page = await browserManager.newPage();

      // Navigate to the URL
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.timeoutMs,
      });

      // Perform any pre-scroll interactions
      if (interactions?.clickSelector) {
        try {
          await page.click(interactions.clickSelector);
          await this.randomDelay(500, 1000);
        } catch {
          // Element may not exist, continue
        }
      }

      // Scroll if requested
      if (interactions?.scroll) {
        await this.scrollPage(page);
      }

      // Wait for specific selector if provided
      if (interactions?.waitForSelector) {
        try {
          await page.waitForSelector(interactions.waitForSelector, {
            timeout: 5000,
          });
        } catch {
          // Selector may not appear, continue
        }
      }

      // Wait for network to settle
      await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});

      // Get the rendered HTML
      const html = await page.content();

      return html;
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {
          // Page may already be closed
        }
      }
    }
  }

  /**
   * Wait for page to be ready (no pending requests, DOM stable)
   */
  private async waitForPageReady(page: Page): Promise<void> {
    try {
      await page.waitForNetworkIdle({ timeout: 5000 });
    } catch {
      // Network may not settle, that's okay
    }
  }

  /**
   * Scroll the page to trigger lazy loading
   * Uses string-based evaluate to avoid TypeScript DOM type issues
   */
  private async scrollPage(page: Page): Promise<void> {
    await page.evaluate(`(async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const scrollHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      let currentPosition = 0;

      while (currentPosition < scrollHeight) {
        window.scrollTo(0, currentPosition);
        currentPosition += viewportHeight / 2;
        await delay(200);
      }

      // Scroll back to top
      window.scrollTo(0, 0);
    })()`);
  }

  /**
   * Add a random delay to appear more human-like
   */
  protected async randomDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Override the default fetchHtml to use browser by default
   * Individual brokers can still use the parent's fetch for simple requests
   */
  protected async fetchHtml(url: string): Promise<string> {
    return this.fetchHtmlWithBrowser(url);
  }
}

/**
 * Options for page interactions
 */
export interface PageInteractions {
  /** CSS selector to click before fetching content */
  clickSelector?: string;
  /** Whether to scroll the page to trigger lazy loading */
  scroll?: boolean;
  /** CSS selector to wait for before getting content */
  waitForSelector?: string;
}
