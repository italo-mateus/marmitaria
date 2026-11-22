import { createHttpError } from "../errors/http-error.js";

export function requireJsonContentType(req, res, next) {
  if (
    req.get("Content-Type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return next(createHttpError(415, "Envie os dados em JSON."));
  }
  next();
}
