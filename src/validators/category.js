import { validateRequiredText } from "./common.js";

export function validateCategory(body) {
  const name = validateRequiredText(
    body.name,
    "O nome da categoria",
    80,
  ).replace(/\s+/g, " ");
  return { name, key: name.normalize("NFC").toLocaleLowerCase("pt-BR") };
}
