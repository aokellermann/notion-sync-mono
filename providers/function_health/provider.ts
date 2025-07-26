import { Browser, HTTPResponse } from "puppeteer";
import type { FunctionHealthData } from "./types";
import { Provider } from "../provider";
import { setTimeout } from 'timers/promises';
import path from "path";

/**
 * Service class for interacting with Function Health website
 */
export class FunctionHealthService extends Provider<FunctionHealthData> {
  private username: string;
  private password: string;
  private browser: Browser;

  constructor(browser: Browser) {
    super(path.join(__dirname, "data.json"));
    this.username = process.env.FUNCTION_HEALTH_USERNAME as string;
    this.password = process.env.FUNCTION_HEALTH_PASSWORD as string;
    this.browser = browser;
    
    if (!this.username || !this.password) {
      console.error("❌ Missing required environment variables: FUNCTION_HEALTH_USERNAME and/or FUNCTION_HEALTH_PASSWORD");
      throw new Error("Missing required environment variables");
    }
  }

  async fetchData(): Promise<FunctionHealthData> {
    const page = await this.browser.newPage();
    
    let responseData: FunctionHealthData | null = null;

    page.on('response', async (response: HTTPResponse) => {
      // console.log("🔍 Response received:", response.url());
      if (response.url().endsWith('/api/v1/results-report')) {
        try {
          const data = await response.json();
          responseData = data;
        } catch (error) {
          console.error("❌ Failed to parse results report response:", error);
        }
      }
    });

    await page.goto("https://my.functionhealth.com/", { waitUntil: 'domcontentloaded' });

    await page.type('#email', this.username);
    await page.type('#password', this.password);

    // Find the parent of the span with text 'Login'
    // waitForSelector doesn't work in bun https://github.com/oven-sh/bun/issues/13853
    const loginButton = page.locator('xpath///span[text()=\'Login\']/..')
    if (!loginButton) {
      throw new Error("Login button parent not found on the page");
    }

    await setTimeout(1000);
    await loginButton.click();

    for (let i = 0; i < 10; i++) {
      await setTimeout(1000);
      if (responseData) {
        return responseData;
      }
    }

    throw new Error("Data not fetched");
  }
}
