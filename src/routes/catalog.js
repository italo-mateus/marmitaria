import { Router } from "express";
import { createCatalogControllers } from "../controllers/catalog.js";
import { requireJsonContentType } from "../middleware/require-json.js";

export function createCatalogRouter(catalog, authenticateAdmin) {
  const router = Router();
  const controllers = createCatalogControllers(catalog);

  router
    .route("/categorias")
    .get(controllers.categories.list)
    .post(
      authenticateAdmin,
      requireJsonContentType,
      controllers.categories.create,
    );
  router
    .route("/categorias/:id")
    .get(controllers.categories.getById)
    .put(
      authenticateAdmin,
      requireJsonContentType,
      controllers.categories.update,
    )
    .delete(
      authenticateAdmin,
      requireJsonContentType,
      controllers.categories.remove,
    );

  router
    .route("/pratos")
    .get(controllers.dishes.list)
    .post(authenticateAdmin, requireJsonContentType, controllers.dishes.create);
  router
    .route("/pratos/:id")
    .get(controllers.dishes.getById)
    .put(authenticateAdmin, requireJsonContentType, controllers.dishes.update)
    .delete(
      authenticateAdmin,
      requireJsonContentType,
      controllers.dishes.remove,
    );

  return router;
}
