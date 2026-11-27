import express from "express";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { openCatalog } from "./models/catalog.js";
import { createApp } from "./create-app.js";

const filename = resolve(process.env.DB_PATH || "data/marmitaria.sqlite");
mkdirSync(dirname(filename), { recursive: true });
const catalog = openCatalog(filename);

const app = express();
app.use(
  createApp(catalog, {
    user: process.env.ADMIN_USER,
    password: process.env.ADMIN_PASSWORD,
  }),
);

export default app;