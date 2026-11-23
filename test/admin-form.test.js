import { test } from "node:test";
import assert from "node:assert/strict";
import { readRecordForm } from "../public/admin-form.js";

function dishForm(price) {
  const form = new FormData();
  form.set("name", "Penne");
  form.set("description", "Molho da casa");
  form.set("cost", price);
  form.set("category_id", "2");
  return form;
}

test("formulário converte valores em reais para centavos sem perder precisão", async () => {
  for (const [price, expected] of [
    ["24,90", 2490], ["24.90", 2490], ["0,01", 1],
    ["10", 1000], ["10,5", 1050], ["999999,99", 99999999],
  ]) {
    const dish = await readRecordForm(dishForm(price), "pratos");
    assert.equal(dish.cents, expected, price);
    assert.equal(dish.category_id, 2);
  }
});

test("formulário rejeita preço zero, negativo e formatos inválidos", async () => {
  for (const price of ["0", "0,00", "-1", "1,234", "abc", "1e3", "", "1000000"]) {
    await assert.rejects(readRecordForm(dishForm(price), "pratos"), /preço/);
  }
});

test("edição preserva a foto omitida e permite sua remoção explícita", async () => {
  const form = dishForm("20");
  assert.equal(Object.hasOwn(await readRecordForm(form, "pratos"), "photo"), false);
  form.set("remove", "on");
  assert.equal((await readRecordForm(form, "pratos")).photo, "");
});

test("formulário de categoria envia somente o nome", async () => {
  const form = new FormData();
  form.set("name", "Massas");
  assert.deepEqual(await readRecordForm(form, "categorias"), { name: "Massas" });
});
