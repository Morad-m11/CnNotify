import express from 'express';
import puppeteer from "puppeteer-core";
import nodemailer from 'nodemailer';
import fs from 'fs';
import https from 'https'
import cors from 'cors'

const app = express();
const port = 3001
app.use(cors())

app.listen(port, () => {
   console.log(`listening on https://localhost:${port}`)
});

app.get('/ping', (_, res) => {
   console.warn("yello /ping");
   res.status(200).send("Pong")
})