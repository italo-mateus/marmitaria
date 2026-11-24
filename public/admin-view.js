import { formatPrice, createElement, getElement } from "./shared.js";

const viewTitles = {
  dashboard: "Visão geral",
  categorias: "Categorias",
  pratos: "Pratos",
};

function createActionButton(text, action, style = "secondary") {
  const button = createElement("button", text, style);
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}

function updateNavigation(view, title) {
  getElement("title").textContent = title;
  getElement("add").hidden = view === "dashboard";
  getElement("add").textContent =
    view === "pratos" ? "Adicionar prato" : "Adicionar categoria";
  for (const tab of document.querySelectorAll("[data-view]")) {
    if (tab.dataset.view === view) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  }
}

function createDashboard(state, onNavigate) {
  const grid = createElement("div", undefined, "stats");
  for (const [view, records] of [
    ["categorias", state.categories],
    ["pratos", state.dishes],
  ]) {
    const card = createElement("section", undefined, "stat");
    card.append(
      createElement("h2", viewTitles[view]),
      createElement("strong", String(records.length)),
      createActionButton("Gerenciar " + viewTitles[view].toLowerCase(), () =>
        onNavigate(view),
      ),
    );
    grid.append(card);
  }
  return grid;
}

function createCategoryFilter(state, onNavigate) {
  const toolbar = createElement("div", undefined, "catalog-filter");
  const label = createElement("label", "Filtrar por categoria");
  const select = createElement("select");
  select.id = "category-filter";
  select.add(new Option("Todas as categorias", ""));
  for (const category of state.categories) {
    select.add(new Option(category.name, category.id));
  }
  select.value = state.selectedCategoryId ?? "";
  select.addEventListener("change", () =>
    onNavigate("pratos", select.value ? Number(select.value) : null),
  );
  label.append(select);
  toolbar.append(
    createActionButton("Voltar às categorias", () => onNavigate("categorias")),
    label,
  );
  return toolbar;
}

function createRecordName(item) {
  const label = createElement("div", undefined, "row-name");
  if (item.photo) {
    const image = createElement("img");
    image.src = item.photo;
    image.alt = "";
    label.append(image);
  }
  label.append(createElement("span", item.name));
  return label;
}

function createRecordActions(item, isDish, actions) {
  const buttons = createElement("div", undefined, "actions");
  if (!isDish) {
    buttons.append(
      createActionButton("Ver pratos", () => actions.onNavigate("pratos", item.id)),
    );
  }
  buttons.append(
    createActionButton("Editar", () => actions.onEdit(item)),
    createActionButton("Excluir", () => actions.onDelete(item), "danger"),
  );
  return buttons;
}

function appendRecordRow(body, item, state, actions) {
  const isDish = state.view === "pratos";
  const row = body.insertRow();
  row.insertCell().append(createRecordName(item));
  if (isDish) {
    row.insertCell().textContent = item.category;
    row.insertCell().textContent = formatPrice(item.cents);
  } else {
    row.insertCell().textContent = state.dishes.filter(
      (dish) => dish.category_id === item.id,
    ).length;
  }
  row.insertCell().append(createRecordActions(item, isDish, actions));
}

function createRecordTable(records, state, actions, title) {
  const wrapper = createElement("div", undefined, "table-wrap");
  const table = createElement("table");
  table.setAttribute("aria-label", title);
  const header = table.createTHead().insertRow();
  const columns =
    state.view === "pratos"
      ? ["Prato", "Categoria", "Preço", "Ações"]
      : ["Categoria", "Pratos", "Ações"];
  for (const column of columns) {
    const cell = createElement("th", column);
    cell.scope = "col";
    header.append(cell);
  }
  const body = table.createTBody();
  for (const item of records) appendRecordRow(body, item, state, actions);
  wrapper.append(table);
  return wrapper;
}

function getVisibleRecords(state) {
  if (state.view === "categorias") return state.categories;
  if (state.selectedCategoryId === null) return state.dishes;
  return state.dishes.filter(
    (dish) => dish.category_id === state.selectedCategoryId,
  );
}

function createEmptyMessage(state) {
  const message =
    state.selectedCategoryId === null
      ? "Nenhum registro cadastrado."
      : "Nenhum prato cadastrado nesta categoria. Use Adicionar prato para começar.";
  return createElement("p", message);
}

export function renderAdminView(state, actions) {
  const category = state.categories.find(
    ({ id }) => id === state.selectedCategoryId,
  );
  const title = category ? "Pratos — " + category.name : viewTitles[state.view];
  updateNavigation(state.view, title);
  const content = getElement("content");
  content.replaceChildren();
  if (state.view === "dashboard") {
    content.append(createDashboard(state, actions.onNavigate));
    return;
  }
  if (state.view === "pratos") {
    content.append(createCategoryFilter(state, actions.onNavigate));
  }
  const records = getVisibleRecords(state);
  content.append(
    records.length
      ? createRecordTable(records, state, actions, title)
      : createEmptyMessage(state),
  );
}
