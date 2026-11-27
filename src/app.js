import express from "express";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { openCatalog } from "./models/catalog.js";
import { createApp } from "./create-app.js";

let filename = resolve(process.env.DB_PATH || "data/marmitaria.sqlite");
if (process.env.VERCEL === "1" && !process.env.DB_PATH) {
  const seed = fileURLToPath(new URL("../data/marmitaria.sqlite", import.meta.url));
  filename = join(tmpdir(), "marmitaria.sqlite");
  if (!existsSync(filename) && existsSync(seed)) {
    copyFileSync(seed, filename);
  }
}
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
