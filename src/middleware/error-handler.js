export function handleRequestError(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }
  if (error.errcode === 2067) {
    return res
      .status(409)
      .json({ erro: "Já existe uma categoria com esse nome." });
  }
  if ([787, 1811].includes(error.errcode)) {
    return res.status(409).json({
      erro: "Remova ou mova os pratos antes de excluir esta categoria.",
    });
  }
  const status = error.status >= 400 && error.status < 500 ? error.status : 500;
  const message = {
    "entity.parse.failed": "O JSON enviado é inválido.",
    "entity.too.large": "Os dados enviados excedem o tamanho permitido.",
  }[error.type];
  if (status === 500) console.error(error);
  res.status(status).json({
    erro:
      message ??
      (status === 500 ? "Erro interno. Tente novamente." : error.message),
  });
}
