import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { openCatalog } from "./models/catalog.js";
import { createApp } from "./app.js";

const filename = resolve(process.env.DB_PATH || "data/marmitaria.sqlite");
mkdirSync(dirname(filename), { recursive: true });
const catalog = openCatalog(filename);
const app = createApp(catalog, {
  user: process.env.ADMIN_USER,
  password: process.env.ADMIN_PASSWORD,
});
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
app.listen(port, host, () =>
  console.log(`Marmitaria disponível em http://${host}:${port}`),
);
