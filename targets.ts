import crypto from 'crypto';
import robotsParser from 'robots-parser';

type CheckResult = {
    name: string;
    url: string;
};

const Target = {
    Heimbau: 'https://www.heimbau.at/neubau',
    Wiensued:
        'https://www.wiensued.at/wohnen/?dev=&city=Wien&search=&space-from=&space-to=&room-from=&room-to=&state%5B%5D=inbau#search-results',
    Schwarzatal: 'https://www.schwarzatal.at/projekte/bau-und-planung'
};

type Target = keyof typeof Target;

const previousHash: Record<Target, string> = {
    Heimbau: '',
    Wiensued: '',
    Schwarzatal: ''
};

export async function checkChangedURLs(): Promise<CheckResult[]> {
    const targets = Object.entries(Target) as [Target, string][];
    const instructions = targets.map(([name, url]) => compareHash(name, url));

    const results = await Promise.all(instructions);
    const updates = results.flat().filter((x) => !!x);

    return updates;
}

async function compareHash(
    name: Target,
    url: string
): Promise<CheckResult | null> {
    try {
        console.log(`INFO | Starting instructions for ${url}`);

        await checkRobotsOrThrow(url);

        const html = await (await fetch(url)).text();
        const hash = crypto.hash('sha256', html, 'hex');

        if (previousHash[name] !== hash) {
            previousHash[name] = hash;
            return { name, url };
        }

        previousHash[name] = hash;
        return null;
    } catch (err) {
        const msg = err instanceof Error ? err.message : JSON.stringify(err);
        console.error(`ERROR | Instructions for ${url} failed. Error: ${msg}`);
        return null;
    } finally {
        console.log(`INFO | Ending instructions for ${url}.`);
    }
}

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
