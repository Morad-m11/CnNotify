import puppeteer, { Browser, Page } from 'puppeteer';
import robotsParser from 'robots-parser';

type CheckResult = {
    name: string;
    url: string;
};

type ItemFnMap = {
    [K in Targets]: (page: Page) => Promise<CheckResult[]>;
};

type Targets = keyof typeof Targets;

const Targets = {
    Heimbau: 'https://www.heimbau.at/node/4202',
    Wiensued:
        'https://www.wiensued.at/wohnen/?dev=&city=Wien&search=&space-from=&space-to=&room-from=&room-to=&state%5B%5D=inbau#search-results',
};

const previousResults: Record<Targets, CheckResult[]> = {
    Heimbau: [],
    Wiensued: [],
};

export async function checkChangedURLs(): Promise<CheckResult[]> {
    const browser = await puppeteer.launch({
        headless: true,
        timeout: 60000,
    });

    const instructions = Object.entries(Targets).map(([name, url]) =>
        openAndExecute(browser, name as Targets, url),
    );

    return await Promise.all(instructions)
        .then((result) => result.flat())
        .finally(async () => {
            await browser.close();
        });
}

async function openAndExecute(
    browser: Browser,
    name: Targets,
    url: string,
): Promise<CheckResult[]> {
    let page: Page | null = null;

    try {
        console.log(`INFO | Starting instructions for ${url}`);

        await checkRobotsOrThrow(url);

        page = await openPage(browser, url);
        const result = await siteInstructions[name](page);
        const changes = getChangedItems(previousResults[name], result);

        // update previous results with current results
        previousResults[name] = result;

        // return only changes
        return changes;
    } catch (error) {
        const message =
            error instanceof Error ? error.message : JSON.stringify(error);
        console.log(
            `ERROR | Instructions for ${url} failed. Error: ${message}`,
        );
        return [];
    } finally {
        await page?.close();

        console.log(`INFO | Ending instructions for ${url}.`);
    }
}

const siteInstructions: ItemFnMap = {
    Heimbau: async (page) => {
        return await page.evaluate(() => {
            const table = document.querySelector('table')!;
            const rows = Array.from(table.querySelectorAll('tbody tr'));

            return rows.map((row) => ({
                name: row.querySelector('td')!.textContent.trim(),
                url: row.querySelector('a')!.href,
            }));
        });
    },
    Wiensued: async (page) => {
        return await page.evaluate(() => {
            const itemBoxes = document.querySelectorAll('.image-and-text');

            return Array.from(itemBoxes).map((item) => ({
                name: item.querySelector('.address h4')!.textContent,
                url: (item.querySelector('.image a') as HTMLLinkElement).href,
            }));
        });
    },
};

async function checkRobotsOrThrow(url: string) {
    const baseUrl = url.slice(0, url.lastIndexOf('/'));
    const robotsTxt = await fetchRobotsFile(baseUrl);

    const isAllowed = robotsParser(baseUrl, robotsTxt).isAllowed(url);

    if (!isAllowed) {
        throw new Error('Disallowed by robots.txt');
    }
}

async function fetchRobotsFile(url: string) {
    const robotsUrl = new URL('/robots.txt', url).href;
    const res = await fetch(robotsUrl);
    return await res.text();
}

async function openPage(browser: Browser, url: string) {
    const page = await browser.newPage();

    const response = await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 60000,
    });

    if (!response) {
        throw new Error('Did not get a page response');
    }

    return page;
}

function getChangedItems(previous: CheckResult[], current: CheckResult[]) {
    const prevSet = new Set(previous);
    const updates = current.filter((x) => !prevSet.has(x));
    return updates;
}
