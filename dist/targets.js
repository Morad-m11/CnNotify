var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import puppeteer, { Page } from "puppeteer";
var Target;
(function (Target) {
    Target["Heimbau"] = "Heimbau";
})(Target || (Target = {}));
const previousItemCount = {
    [Target.Heimbau]: 0,
};
function openAndExecute(name, url) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`INFO | Starting instructions for ${url}`);
        try {
            const browser = yield puppeteer.launch({
                headless: true,
                timeout: 60000,
            });
            const page = yield browser.newPage();
            const response = yield page.goto(url, {
                waitUntil: "networkidle0",
                timeout: 60000,
            });
            if (!response) {
                return { name, url, changes: false };
            }
            const count = yield getItemCount[name](page);
            const status = response.status();
            yield browser.close();
            console.log(`INFO | Ending instructions for ${url}. Status: ${status}. Previous Count: ${previousItemCount[name]}, Current Count: ${count}`);
            if (count && count > previousItemCount[name]) {
                previousItemCount[name] = count;
                return { name, url, changes: true };
            }
            else {
                return { name, url, changes: false };
            }
        }
        catch (error) {
            console.log(`ERROR | Instructions for ${url} failed. Error: ${error}`);
            return { name, url, changes: false };
        }
    });
}
export const TARGETS = [
    {
        name: Target.Heimbau,
        url: "https://www.heimbau.at/node/4202",
        instructions: function () {
            return __awaiter(this, void 0, void 0, function* () {
                return yield openAndExecute(this.name, this.url);
            });
        },
    },
    // {
    //     name: Target["WBV-GPA"],
    //     url: "https://www.wbv-gpa.at/wohnungen/",
    //     instructions: async function () {
    //         return await openAndExecute(this.name, this.url);
    //     },
    // },
    // {
    //     name: Target.OESW,
    //     url: "https://www.oesw.at/immobilienangebot/sofort-wohnen.html?region=1210",
    //     instructions: async function () {
    //         return await openAndExecute(this.name, this.url);
    //     },
    // },
    // {
    //     name: Target.Schwarzatal,
    //     url: "https://www.schwarzatal.at/immobiliensuche",
    //     instructions: async function () {
    //         return await openAndExecute(this.name, this.url);
    //     },
    // },
];
const getItemCount = {
    [Target.Heimbau]: (page) => __awaiter(void 0, void 0, void 0, function* () {
        yield page.waitForNetworkIdle();
        const rows = yield page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll("table tr td"));
            return rows;
        });
        console.warn(rows);
        return 0;
        // const selectorExists = await page
        //     .waitForSelector(".objects__list__rows__item", { timeout: 5000 })
        //     .catch(() => null);
        // if (!selectorExists) {
        //     console.log("WARN | No Elements found for WBV-GPA");
        //     return 0;
        // }
        // const searchResults = await page.evaluate(() => {
        //     const items = document.querySelectorAll(
        //         ".objects__list__rows__item",
        //     );
        //     return Array.from(items)
        //         .map((item) => item.getAttribute("data-location"))
        //         .filter(
        //             (location) =>
        //                 location && location?.toLowerCase().includes("pöls"),
        //         );
        // });
        // return searchResults.length;
    }),
    // "WBV-GPA": async (page) => {
    //     const selectorExists = await page
    //         .waitForSelector(".objects__list__rows__item", { timeout: 5000 })
    //         .catch(() => null);
    //     if (!selectorExists) {
    //         console.log("WARN | No Elements found for WBV-GPA");
    //         return 0;
    //     }
    //     const searchResults = await page.evaluate(() => {
    //         const items = document.querySelectorAll(
    //             ".objects__list__rows__item",
    //         );
    //         return Array.from(items)
    //             .map((item) => item.getAttribute("data-location"))
    //             .filter(
    //                 (location) =>
    //                     location && location?.toLowerCase().includes("pöls"),
    //             );
    //     });
    //     return searchResults.length;
    // },
    // OESW: async (page) => {
    //     const selectorExists = await page
    //         .waitForSelector(".og-grid li", { timeout: 5000 })
    //         .catch(() => null);
    //     if (!selectorExists) {
    //         console.log("WARN | No Elements found for OESW");
    //         return 0;
    //     }
    //     const searchResults = await page.$$(".og-grid li");
    //     return searchResults.length;
    // },
    // Schwarzatal: async (page) => {
    //     const selectorExists = await page
    //         .waitForSelector(".immo-item-inside .headline", { timeout: 5000 })
    //         .catch(() => null);
    //     if (!selectorExists) {
    //         console.log("WARN | No Elements found for Schwarzatal");
    //         return 0;
    //     }
    //     const searchResults = await page.evaluate(() => {
    //         const items = document.querySelectorAll(
    //             ".immo-item-inside .headline",
    //         );
    //         return Array.from(items)
    //             .map((item) => item.textContent)
    //             .filter((text) => !!text)
    //             .filter(
    //                 (text) =>
    //                     text?.toLowerCase().includes("wien") &&
    //                     text.includes("1210"),
    //             );
    //     });
    //     return searchResults.length;
    // },
};
//# sourceMappingURL=targets.js.map