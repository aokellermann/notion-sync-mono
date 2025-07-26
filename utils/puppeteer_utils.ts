import puppeteer, { Browser } from "puppeteer";

declare module "bun" {
    interface Env {
        BROWSER_WS_PATH?: string;
    }
}

const port = 9222;

export async function useBrowser<T>(callback: (browser: Browser) => Promise<T>): Promise<T> {
    if (Bun.env.BROWSER_WS_PATH) {
        return await useExistingBrowser(callback);
    } else {
        return await useNewBrowser(callback);
    }
}

export async function useNewBrowser<T>(callback: (browser: Browser) => Promise<T>): Promise<T> {
    let browser: Browser | null = null;
    try {
        browser = await puppeteer.launch({ headless: false, debuggingPort: port });
        return await callback(browser);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

export async function useExistingBrowser<T>(callback: (browser: Browser) => Promise<T>): Promise<T> {
    let browser: Browser | null = null;
    try {
        browser = await puppeteer.connect({
            browserWSEndpoint: `ws://127.0.0.1:${port}${process.env.BROWSER_WS_PATH}`,
        });
        return await callback(browser);
    } finally {
        if (browser) {
            await browser.disconnect();
        }
    }
}
