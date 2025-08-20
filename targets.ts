import crypto from 'crypto';
import robotsParser from 'robots-parser';

const Target = {
    Heimbau: 'https://www.heimbau.at/neubau',
    Wiensued:
        'https://www.wiensued.at/wohnen/?dev=&city=Wien&search=&space-from=&space-to=&room-from=&room-to=&state%5B%5D=inbau#search-results',
    Schwarzatal: 'https://www.schwarzatal.at/projekte/bau-und-planung'
};

type Target = keyof typeof Target;

type CheckResult = {
    name: string;
    url: string;
};

const FETCH_TIMEOUT_MS = 10_000;

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

        const html = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
        if (html == null) {
            console.warn(`WARN | Could not fetch ${url}`);
            return null;
        }

        const normalized = simpleNormalizeHtml(html);
        const hash = crypto.hash('sha256', normalized, 'hex');

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

async function fetchWithTimeout(
    url: string,
    timeoutMs: number
): Promise<string | null> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!res.ok) {
            console.warn(`WARN | Fetch ${url} returned ${res.status}`);
            return null;
        }
        return await res.text();
    } catch (e) {
        clearTimeout(id);
        if ((e as any)?.name === 'AbortError') {
            console.warn(`WARN | Fetch timeout for ${url}`);
        } else {
            console.warn(`WARN | Fetch error for ${url}: ${String(e)}`);
        }
        return null;
    }
}

/**
 * Conservative, small normalization:
 * - strip comments, scripts, styles
 * - remove all tags (leave text)
 * - remove obvious timestamps and long hex/build-hashes
 * - collapse whitespace, lowercase
 */
function simpleNormalizeHtml(html: string): string {
    let s = html;

    // strip HTML comments
    s = s.replace(/<!--[\s\S]*?-->/g, ' ');

    // remove script/style blocks
    s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');
    s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');

    // remove all tags but keep text content
    s = s.replace(/<\/?[a-z][^>]*>/gi, ' ');

    // remove data-* attributes / inline handlers that might have stayed in text (edge cases)
    s = s.replace(/\bdata-[a-z0-9-]+=["'][^"']*["']/gi, ' ');
    s = s.replace(/\bon\w+=["'][^"']*["']/gi, ' ');

    // remove ISO timestamps and common date patterns
    s = s.replace(
        /\b\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:z|[+\-]\d{2}:\d{2})\b/gi,
        ' '
    );
    s = s.replace(/\b\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2}\b/g, ' ');
    s = s.replace(/\b\d{10}\b/g, ' ');
    s = s.replace(/\b\d{13}\b/g, ' ');

    // remove long-ish hex sequences that are likely build hashes (>=8 hex chars)
    s = s.replace(/\b[a-f0-9]{8,}\b/gi, ' ');

    // collapse whitespace and lowercase
    s = s.replace(/\s+/g, ' ').trim().toLowerCase();

    return s;
}
