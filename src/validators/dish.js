import { createHttpError } from "../errors/http-error.js";
import {
  validateRequiredText,
  parsePositiveId,
  validatePhotoDataUrl,
} from "./common.js";

export function validateDish(body, categories, previousDish) {
  const name = validateRequiredText(body.name, "O nome do prato", 100);
  const description = validateRequiredText(
    body.description,
    "A descrição",
    600,
  );
  const category_id = parsePositiveId(body.category_id);
  if (!categories.get(category_id)) {
    throw createHttpError(400, "Selecione uma categoria cadastrada.");
  }
  if (
    !Number.isSafeInteger(body.cents) ||
    body.cents <= 0 ||
    body.cents > 99_999_999
  ) {
    throw createHttpError(
      400,
      "Informe um preço entre R$ 0,01 e R$ 999.999,99.",
    );
  }
  return {
    name,
    description,
    category_id,
    cents: body.cents,
    photo:
      body.photo === undefined
        ? (previousDish?.photo ?? "")
        : validatePhotoDataUrl(body.photo),
  };
}
