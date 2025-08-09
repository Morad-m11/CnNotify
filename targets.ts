import puppeteer, { Page } from 'puppeteer';
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
    const instructions = Object.entries(Targets).map(([name, url]) =>
        openAndExecute(name as Targets, url),
    );

    return (await Promise.all(instructions)).flat();
}

async function openAndExecute(
    name: Targets,
    url: string,
): Promise<CheckResult[]> {
    console.log(`INFO | Starting instructions for ${url}`);

    const isAllowed = await checkRobotsFile(url);

    if (!isAllowed) {
        console.log(
            `WARN | Instructions for ${url} failed. Disallowed by robots.txt`,
        );
        return [];
    }

    try {
        const browser = await puppeteer.launch({
            headless: true,
            timeout: 60000,
        });

        const page = await browser.newPage();

        const response = await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 60000,
        });

        if (!response) {
            return [];
        }

        const items = await itemFns[name](page);
        const status = response.status();
        await browser.close();

        console.log(`INFO | Ending instructions for ${url}. Status: ${status}`);

        if (JSON.stringify(items) !== JSON.stringify(previousResults[name])) {
            previousResults[name] = items;
            return items;
        }

        return [];
    } catch (error) {
        console.log(`ERROR | Instructions for ${url} failed. Error: ${error}`);
        return [];
    }
}

const itemFns: ItemFnMap = {
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

async function checkRobotsFile(url: string) {
    const baseUrl = url.slice(0, url.lastIndexOf('/'));
    const robotsTxt = await fetchRobotsFile(baseUrl);
    return robotsParser(baseUrl, robotsTxt).isAllowed(url);
}

async function fetchRobotsFile(url: string) {
    const robotsUrl = new URL('/robots.txt', url).href;
    const res = await fetch(robotsUrl);
    return await res.text();
}
