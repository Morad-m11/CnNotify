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
    const start = Date.now();

    try {
        const updates = await checkChangedURLs();
        console.log('INFO | Returning items changed: ', updates);
        res.status(200).send(updates);
    } catch (error) {
        res.status(500).json(error);
    } finally {
        const end = Date.now();
        console.log(`-- Time taken for all checks: ${end - start}ms`);
    }
});
