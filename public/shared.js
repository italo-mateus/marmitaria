export const getElement = (id) => document.getElementById(id);

export async function requestApi(path, method = "GET", body) {
  const options =
    method === "GET"
      ? {}
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        };
  const response = await fetch("/api/" + path, options);
  if (response.status === 204) {
    return;
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.erro);
  }
  return data;
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
export const formatPrice = (cents) => currency.format(cents / 100);

export function createElement(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
