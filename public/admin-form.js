import { createElement, getElement } from "./shared.js";

function createFormField(label, tag, name, value = "", required = false) {
  const wrapper = createElement("label", label);
  const input = createElement(tag);
  input.name = name;
  input.value = value;
  input.required = required;
  wrapper.append(input);
  getElement("fields").append(wrapper);
  return input;
}

function createCategoryField(categories, selectedId) {
  const select = createFormField("Categoria", "select", "category_id", "", true);
  select.add(new Option("Selecione…", ""));
  for (const category of categories) {
    select.add(new Option(category.name, category.id));
  }
  select.value = selectedId ?? "";
}

function createPhotoFields(item) {
  const photo = createFormField(
    "Foto (JPEG, PNG ou WebP, até 1 MB)",
    "input",
    "photo",
  );
  photo.type = "file";
  photo.accept = "image/jpeg,image/png,image/webp";
  if (!item?.photo) return;
  const preview = createElement("img", undefined, "preview");
  preview.src = item.photo;
  preview.alt = "Foto atual";
  getElement("fields").append(preview);
  createFormField("Remover foto atual", "input", "remove").type = "checkbox";
}

function createDishFields(item, categories, categoryId) {
  createFormField(
    "Descrição",
    "textarea",
    "description",
    item?.description,
    true,
  ).maxLength = 600;
  const cost = item ? (item.cents / 100).toFixed(2).replace(".", ",") : "";
  createFormField("Preço (R$)", "input", "cost", cost, true).inputMode = "decimal";
  createCategoryField(categories, item?.category_id ?? categoryId);
  createPhotoFields(item);
}

export function openRecordEditor({ path, item, categories, categoryId }) {
  const isDish = path === "pratos";
  getElement("dialog-title").textContent =
    (item ? "Editar " : "Adicionar ") + (isDish ? "prato" : "categoria");
  getElement("form-error").textContent = "";
  getElement("fields").replaceChildren();
  const name = createFormField("Nome", "input", "name", item?.name, true);
  name.maxLength = isDish ? 100 : 80;
  if (isDish) createDishFields(item, categories, categoryId);
  getElement("editor").showModal();
  name.focus();
}

function parsePriceInCents(value) {
  const cost = value.trim();
  if (!/^\d{1,6}(?:[.,]\d{1,2})?$/.test(cost)) {
    throw new Error("Informe um preço válido, por exemplo 24,90.");
  }
  const [whole, fraction = ""] = cost.split(/[.,]/);
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (cents <= 0) throw new Error("O preço deve ser maior que zero.");
  return cents;
}

function readPhotoAsDataUrl(file) {
  if (file.size > 1_048_576) throw new Error("A foto deve ter até 1 MB.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Não foi possível ler a foto."));
    reader.readAsDataURL(file);
  });
}

async function readPhotoChange(form) {
  const file = form.get("photo");
  if (file?.size) return { photo: await readPhotoAsDataUrl(file) };
  return form.has("remove") ? { photo: "" } : {};
}

export async function readRecordForm(form, path) {
  const data = { name: form.get("name") };
  if (path === "categorias") return data;
  return {
    ...data,
    cents: parsePriceInCents(form.get("cost")),
    description: form.get("description"),
    category_id: Number(form.get("category_id")),
    ...(await readPhotoChange(form)),
  };
}

export function setFormSaving(isSaving) {
  getElement("save").disabled = isSaving;
  getElement("cancel").disabled = isSaving;
}
