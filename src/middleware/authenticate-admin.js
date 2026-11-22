import { createHash, timingSafeEqual } from "node:crypto";

function hashCredentials(value) {
  return createHash("sha256").update(value).digest();
}

export function createAdminAuthentication({ user, password }) {
  if (!user || user.includes(":") || !password || password.length < 12) {
    throw new Error(
      "Configure ADMIN_USER e ADMIN_PASSWORD (mínimo de 12 caracteres).",
    );
  }
  const expectedCredentialsHash = hashCredentials(user + ":" + password);
  return (req, res, next) => {
    const [, encodedCredentials] =
      /^Basic ([A-Za-z0-9+/=]+)$/i.exec(req.get("Authorization") ?? "") ?? [];
    if (
      encodedCredentials &&
      timingSafeEqual(
        expectedCredentialsHash,
        hashCredentials(Buffer.from(encodedCredentials, "base64")),
      )
    ) {
      return next();
    }
    res.set("WWW-Authenticate", 'Basic realm="Marmitaria", charset="UTF-8"');
    res
      .status(401)
      .json({ erro: "Entre com as credenciais de administração." });
  };
}
