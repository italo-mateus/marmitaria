import { requestApi, getElement } from "./shared.js";
import { renderAdminView } from "./admin-view.js";
import { openRecordEditor, readRecordForm, setFormSaving } from "./admin-form.js";

const state = {
  view: "dashboard",
  selectedCategoryId: null,
  categories: [],
  dishes: [],
};
let editingRecord;
let isSaving = false;

function render() {
  renderAdminView(state, {
    onNavigate: showAdminView,
    onEdit: editRecord,
    onDelete: deleteRecord,
  });
}

async function loadCatalog(message = "") {
  getElement("status").textContent = "Carregando…";
  try {
    [state.categories, state.dishes] = await Promise.all([
      requestApi("categorias"),
      requestApi("pratos"),
    ]);
    if (!state.categories.some(({ id }) => id === state.selectedCategoryId)) {
      state.selectedCategoryId = null;
    }
    render();
    getElement("status").textContent = message;
  } catch (error) {
    getElement("status").textContent = error.message;
  }
}

function showAdminView(view, categoryId = null) {
  state.view = view;
  state.selectedCategoryId = view === "pratos" ? categoryId : null;
  getElement("status").textContent = "";
  render();
}

function editRecord(item) {
  if (isSaving) return;
  if (state.view === "pratos" && !state.categories.length) {
    getElement("status").textContent =
      "Cadastre uma categoria antes de adicionar um prato.";
    return;
  }
  editingRecord = { path: state.view, item };
  openRecordEditor({
    ...editingRecord,
    categories: state.categories,
    categoryId: state.selectedCategoryId,
  });
}

async function deleteRecord(item) {
  if (isSaving || !window.confirm("Excluir “" + item.name + "”?")) return;
  const path = state.view;
  isSaving = true;
  try {
    await requestApi(path + "/" + item.id, "DELETE");
    await loadCatalog("Registro excluído.");
  } catch (error) {
    getElement("status").textContent = error.message;
  } finally {
    isSaving = false;
  }
}

async function saveRecord(event) {
  event.preventDefault();
  if (isSaving) return;
  isSaving = true;
  setFormSaving(true);
  getElement("form-error").textContent = "";
  const { path, item } = editingRecord;
  const form = new FormData(event.currentTarget);
  try {
    const data = await readRecordForm(form, path);
    await requestApi(
      item ? path + "/" + item.id : path,
      item ? "PUT" : "POST",
      data,
    );
    getElement("editor").close();
    await loadCatalog("Registro salvo.");
  } catch (error) {
    getElement("form-error").textContent = error.message;
  } finally {
    isSaving = false;
    setFormSaving(false);
  }
}

function bindAdminEvents() {
  getElement("form").addEventListener("submit", saveRecord);
  getElement("editor").addEventListener("cancel", (event) => {
    if (isSaving) event.preventDefault();
  });
  getElement("cancel").addEventListener("click", () =>
    getElement("editor").close(),
  );
  getElement("add").addEventListener("click", () => editRecord());
  for (const tab of document.querySelectorAll("[data-view]")) {
    tab.addEventListener("click", () => showAdminView(tab.dataset.view));
  }
}

bindAdminEvents();
await loadCatalog();
