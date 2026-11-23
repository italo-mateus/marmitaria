import { requestApi, formatPrice, createElement } from "./shared.js";

const filters = document.querySelector("#filters");
const dishes = document.querySelector("#dishes");
const status = document.querySelector("#status");
let latestRequestId = 0;

async function loadMenu(category) {
  const requestId = ++latestRequestId;
  for (const button of filters.children) {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.id === String(category)),
    );
  }
  dishes.replaceChildren();
  status.textContent = "Carregando cardápio…";
  try {
    const items = await requestApi(
      category ? "pratos?categoria=" + category : "pratos",
    );
    if (requestId !== latestRequestId) {
      return;
    }
    status.textContent = items.length
      ? ""
      : "Nenhum prato disponível nesta seleção.";
    for (const item of items) {
      const card = createElement("article", undefined, "card");
      if (item.photo) {
        const image = createElement("img");
        image.src = item.photo;
        image.alt = "";
        image.loading = "lazy";
        image.addEventListener("error", () => image.remove());
        card.append(image);
      }
      const body = createElement("div", undefined, "card-body");
      body.append(
        createElement("span", item.category, "category"),
        createElement("h3", item.name),
        createElement("p", item.description),
        createElement("strong", formatPrice(item.cents)),
      );
      card.append(body);
      dishes.append(card);
    }
  } catch (error) {
    if (requestId === latestRequestId) status.textContent = error.message;
  }
}

try {
  const categories = await requestApi("categorias");
  for (const { id, name } of [{ id: 0, name: "Todos" }, ...categories]) {
    const button = createElement("button", name, "filter");
    button.dataset.id = id;
    button.addEventListener("click", () => loadMenu(id));
    filters.append(button);
  }
  await loadMenu(0);
} catch (error) {
  status.textContent = error.message;
}
