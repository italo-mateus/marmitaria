import { createHttpError } from "../errors/http-error.js";
import { parsePositiveId } from "../validators/common.js";
import { validateCategory } from "../validators/category.js";
import { validateDish } from "../validators/dish.js";

function createResourceController(model, validate, listRecords) {
  function findRecordOrThrow(id) {
    const record = model.get(id);
    if (!record) {
      throw createHttpError(404, "Registro não encontrado.");
    }
    return record;
  }

  return {
    list(req, res) {
      res.json(listRecords(req));
    },
    getById(req, res) {
      res.json(findRecordOrThrow(parsePositiveId(req.params.id)));
    },
    create(req, res) {
      const id = model.add(validate(req.body ?? {}));
      res
        .location(req.baseUrl + req.path + "/" + id)
        .status(201)
        .json(findRecordOrThrow(id));
    },
    update(req, res) {
      const id = parsePositiveId(req.params.id);
      const previousRecord = findRecordOrThrow(id);
      model.update(id, validate(req.body ?? {}, previousRecord));
      res.json(findRecordOrThrow(id));
    },
    remove(req, res) {
      const id = parsePositiveId(req.params.id);
      findRecordOrThrow(id);
      model.remove(id);
      res.status(204).end();
    },
  };
}

export function createCatalogControllers({ categories, dishes }) {
  return {
    categories: createResourceController(categories, validateCategory, () =>
      categories.list(),
    ),
    dishes: createResourceController(
      dishes,
      (body, previousDish) => validateDish(body, categories, previousDish),
      (req) => {
        const categoryId =
          req.query.categoria === undefined
            ? null
            : parsePositiveId(req.query.categoria);
        return dishes.list(categoryId);
      },
    ),
  };
}
