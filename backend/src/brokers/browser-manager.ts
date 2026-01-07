import type { Browser, Page } from 'puppeteer-core';
import puppeteer from 'puppeteer-core';

/**
 * Singleton browser manager for Lambda
 * Manages Chromium lifecycle to reuse browser instances within a single invocation
 */
class BrowserManager {
  private browser: Browser | null = null;
  private isLambda: boolean;

  constructor() {
    this.isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  }

  /**
   * Get or create a browser instance
   * Uses @sparticuz/chromium in Lambda, local Chrome for development
   */
  async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    if (this.isLambda) {
      // Lambda environment: use @sparticuz/chromium
      const chromium = await import('@sparticuz/chromium');
      
      this.browser = await puppeteer.launch({
        args: chromium.default.args,
        defaultViewport: chromium.default.defaultViewport,
        executablePath: await chromium.default.executablePath(),
        headless: chromium.default.headless,
      });
    } else {
      // Local development: use system Chrome
      const executablePath = this.getLocalChromePath();
      
      this.browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
        executablePath,
        headless: true,
      });
    }

    return this.browser;
  }

  /**
   * Create a new page with anti-detection settings
   */
  async newPage(): Promise<Page> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    // Set realistic viewport
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Set realistic user agent
    await page.setUserAgent(this.getRandomUserAgent());

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Enable JavaScript
    await page.setJavaScriptEnabled(true);

    return page;
  }

  /**
   * Close the browser and cleanup resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        // Browser may already be closed
        console.warn('Browser close warning:', error);
      }
      this.browser = null;
    }
  }

  /**
   * Get the path to local Chrome installation
   */
  private getLocalChromePath(): string {
    const platform = process.platform;
    
    if (platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (platform === 'win32') {
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else {
      // Linux
      return '/usr/bin/google-chrome';
    }
  }

  /**
   * Get a random realistic user agent
   */
  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }
}

// Export singleton instance
export const browserManager = new BrowserManager();

