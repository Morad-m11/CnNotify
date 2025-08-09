import cors from 'cors';
import express from 'express';
import { checkChangedURLs } from './targets';

const app = express();
const port = 3001;

app.use(cors());
app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});

app.get('/ping', (_, res) => {
    console.log('Pinged');

    res.status(200).send('Pong');
});

app.get('/check', async (_, res) => {
    console.time('-- Time taken for all checks --');

    // added changes for backwards compatibility
    const updated = (await checkChangedURLs()).map((x) => ({
        ...x,
        changes: true,
    }));

    if (updated.length > 0) {
        res.status(200).send(updated);
    } else {
        res.status(408).send();
    }

    console.timeEnd('-- Time taken for all checks --');
});
