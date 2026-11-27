import express from "express";
import { fileURLToPath } from "node:url";
import { createCatalogRouter } from "./routes/catalog.js";
import { handleRequestError } from "./middleware/error-handler.js";
import { createAdminAuthentication } from "./middleware/authenticate-admin.js";

const resolveAppPath = (name) => fileURLToPath(new URL(name, import.meta.url));

export function createApp(catalog, { user, password }) {
  const authenticateAdmin = createAdminAuthentication({ user, password });
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data: https://images.unsplash.com; style-src 'self'; frame-ancestors 'none'; base-uri 'none'",
    );
    next();
  });
  app.use(express.static(resolveAppPath("../public/")));
  app.get("/", (req, res) =>
    res.sendFile(resolveAppPath("./views/index.html")),
  );
  app.get("/admin", authenticateAdmin, (req, res) => {
    res
      .set("Cache-Control", "no-store")
      .sendFile(resolveAppPath("./views/admin.html"));
  });
  app.use(
    "/api",
    express.json({ limit: "1500kb" }),
    createCatalogRouter(catalog, authenticateAdmin),
  );
  app.use((req, res) =>
    res.status(404).json({ erro: "Página ou recurso não encontrado." }),
  );
  app.use(handleRequestError);
  return app;
}
