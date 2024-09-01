import express from 'express';
import cors from 'cors'
import { TARGETS } from './targets.js'

const app = express();
const port = 3001
app.use(cors())

app.listen(port, () => {
   console.log(`listening on https://localhost:${port}`)
});

app.get('/ping', (_, res) => {
   res.status(200).send("Pong")
})

app.get('/check-and-notify', async (_, res) => {
   console.time("-- Time taken for all checks --");

   const results = await checkAllURLs();
   const resultsWithUpdates = results.filter(resultObj => resultObj.changes === true);

   console.log("INFO | Returning items changed: ", resultsWithUpdates)

   if (resultsWithUpdates.length > 0) {
      res.status(200).send(resultsWithUpdates)
   } else {
      res.status(207).send()
   }

   console.timeEnd("-- Time taken for all checks --");
})

/**
 * @returns { Promise<{name: string, url: string, changes: Boolean}[]> }
 */
async function checkAllURLs() {
   return await Promise.all(
      TARGETS.map(x => x.instructions())
   )
}
