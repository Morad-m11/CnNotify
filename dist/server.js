var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import cors from "cors";
import express from "express";
import { TARGETS } from "./targets";
const app = express();
const port = 3001;
app.use(cors());
app.listen(port, () => {
    console.log(`listening on https://localhost:${port}`);
});
app.get("/ping", (_, res) => {
    console.log("Pinged");
    res.status(200).send("Pong");
});
app.get("/check", (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Checking in");
    console.time("-- Time taken for all checks --");
    const results = yield checkAllURLs();
    const resultsWithUpdates = results.filter((resultObj) => resultObj.changes === true);
    console.log("INFO | Returning items changed: ", resultsWithUpdates);
    if (resultsWithUpdates.length > 0) {
        res.status(200).send(resultsWithUpdates);
    }
    else {
        res.status(408).send();
    }
    console.timeEnd("-- Time taken for all checks --");
}));
/**
 * @returns { Promise<{name: string, url: string, changes: Boolean}[]> }
 */
function checkAllURLs() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield Promise.all(TARGETS.map((x) => x.instructions()));
    });
}
//# sourceMappingURL=server.js.map