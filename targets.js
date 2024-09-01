import puppeteer, { Page } from "puppeteer";

/**
 * 
 * @param {string} name 
 * @param {string} url 
 * @returns { Promise<{name: string, url: string, changes: Boolean}> }
 */
async function openAndExecute(name, url) {
    console.log(`INFO | Starting instructions for ${url}`);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: 'networkidle0' });

    const count = await getItemCount[name](page);

    const status = response.status();
    await browser.close();

    console.log(`INFO | Ending instructions for ${url}. Status: ${status}. Previous Count: ${previousItemCount[name]}, Current Count: ${count}`);

    if (count && count > previousItemCount[name]) {
        previousItemCount[name] = count;
        return { name, url, changes: true }
    } else {
        return { name, url, changes: false }
    }
}

const previousItemCount = {
    "WBV-GPA": 0,
    "OESW": 0,
    "Schwarzatal": 0
}

/**
 * @type {{name: string, url: string, instructions: () => Promise<{name: string, url: string, changes: Boolean}>}[]}
 */
export const TARGETS = [
    {
        name: "OEVW",
        url: "https://www.oevw.at/suche",
        instructions: async function () {
            // Blocked
            return { name: this.name, url: this.url, changes: false }
        }
    },
    {
        name: "WBV-GPA",
        url: "https://www.wbv-gpa.at/wohnungen/",
        instructions: async function () {
            return await openAndExecute(this.name, this.url);
        }
    },
    {
        name: "OESW",
        url: "https://www.oesw.at/immobilienangebot/sofort-wohnen.html?region=1210",
        instructions: async function () {
            return await openAndExecute(this.name, this.url);
        }
    },
    {
        name: "Schwarzatal",
        url: "https://www.schwarzatal.at/immobiliensuche",
        instructions: async function () {
            return await openAndExecute(this.name, this.url);
        }
    },
    {
        name: "Siedlungsunion",
        url: "https://www.siedlungsunion.at/wohnen/sofort",
        instructions: async function () {
            // Seems to be empty/not working

            return { name: this.name, url: this.url, changes: false }
            // return await openAndExecute(this.name, this.url);
        }
    },
    {
        name: "GWSG",
        url: "https://www.gwsg.at/freie-wohnungen",
        instructions: async function () {
            // Only one result, not sure if working

            return { name: this.name, url: this.url, changes: false }
            // return await openAndExecute(this.name, this.url);
        }
    },
]

/**
 * @type {Record<string, (page: Page) => Promise<Number | null>>}
 */
const getItemCount = {
    "WBV-GPA": async (page) => {
        const selectorExists = await page.waitForSelector('.objects__list__rows__item', { timeout: 5000 })
            .catch((_) => null);

        if (!selectorExists) {
            console.log("WARN | No Elements found for WBV-GPA")
            return null;
        }

        const searchResults = await page.evaluate(() => {
            const items = document.querySelectorAll('.objects__list__rows__item');

            return Array.from(items)
                .map(item => item.getAttribute('data-location'))
                .filter(location => location && location?.toLowerCase().includes('pöls'));
        });

        return searchResults.length;
    },
    "OESW": async (page) => {
        const selectorExists = await page.waitForSelector('.og-grid li', { timeout: 5000 })
            .catch(err => null);

        if (!selectorExists) {
            console.log("WARN | No Elements found for OESW")
            return null;
        }

        const searchResults = await page.$$('.og-grid li')

        return searchResults.length
    },
    "Schwarzatal": async (page) => {
        const selectorExists = await page.waitForSelector('.immo-item-inside .headline', { timeout: 5000 })
            .catch(err => null);

        if (!selectorExists) {
            console.log("WARN | No Elements found for Schwarzatal")
            return null;
        }

        const searchResults = await page.evaluate(() => {
            const items = document.querySelectorAll('.immo-item-inside .headline');

            return Array.from(items)
                .map(item => item.textContent)
                .filter(text => !!text)
                .filter(text => text?.toLowerCase().includes('wien') && text.includes('1210'));
        });

        return searchResults.length
    }
}
