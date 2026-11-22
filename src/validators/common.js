import { createHttpError } from "../errors/http-error.js";

export function validateRequiredText(value, label, limit) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.length > limit) {
    throw createHttpError(400, `${label} deve ter de 1 a ${limit} caracteres.`);
  }
  return text;
}

export function parsePositiveId(value) {
  if (
    !/^[1-9]\d*$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value))
  ) {
    throw createHttpError(400, "Identificador inválido.");
  }
  return Number(value);
}

export function validatePhotoDataUrl(value) {
  if (value === "" || value === undefined) {
    return "";
  }
  if (typeof value !== "string" || value.length > 1_400_000) {
    throw createHttpError(400, "A foto deve ter até 1 MB.");
  }
  const imageDataUrlPattern =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
  const imageMatch = imageDataUrlPattern.exec(value);
  if (imageMatch) {
    const imageBytes = Buffer.from(imageMatch[2], "base64");
    const matchesFileSignature = {
      jpeg: imageBytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])),
      png: imageBytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      webp:
        imageBytes.toString("ascii", 0, 4) === "RIFF" &&
        imageBytes.toString("ascii", 8, 12) === "WEBP",
    };
    if (imageBytes.length <= 1_048_576 && matchesFileSignature[imageMatch[1]]) {
      return value;
    }
  }
  throw createHttpError(400, "Escolha uma foto JPEG, PNG ou WebP de até 1 MB.");
}
