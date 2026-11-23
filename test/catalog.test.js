import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { openCatalog } from "../src/models/catalog.js";
import { createApp } from "../src/app.js";

test("cardápio público e CRUD administrativo", async (t) => {
  const catalog = openCatalog(":memory:");
  const password = "senha-do-teste-123";
  const server = createApp(catalog, { user: "admin", password }).listen(
    0,
    "127.0.0.1",
  );
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    catalog.close();
  });
  await once(server, "listening");
  const base = "http://127.0.0.1:" + server.address().port;
  const authorization =
    "Basic " + Buffer.from("admin:" + password).toString("base64");
  async function request(path, status, method = "GET", data, auth = true) {
    const headers = {};
    if (auth) headers.Authorization = authorization;
    if (method !== "GET") headers["Content-Type"] = "application/json";
    const response = await fetch(base + path, {
      method,
      headers,
      body: JSON.stringify(data),
    });
    assert.equal(response.status, status, method + " " + path);
    if (status === 204) {
      return;
    }
    return response.headers.get("content-type").includes("json")
      ? response.json()
      : response.text();
  }

  assert.match(
    await request("/", 200, "GET", undefined, false),
    /Nosso cardápio/,
  );
  await request("/admin", 401, "GET", undefined, false);
  assert.match(await request("/admin", 200), /Adicionar|Visão geral/);
  const categories = "/api/categorias";
  const dishes = "/api/pratos";
  await request(categories, 401, "POST", { name: "Massas" }, false);
  await request(categories, 400, "POST", { name: " " });
  const category = await request(categories, 201, "POST", { name: "Massas" });
  await request(categories, 409, "POST", { name: " MASSAS " });
  await request(categories + "/" + category.id, 200, "PUT", {
    name: "Massas frescas",
  });
  const data = {
    name: "Penne",
    description: "Molho da casa",
    cents: 2290,
    category_id: category.id,
  };
  await request(dishes, 400, "POST", { ...data, cents: 0 });
  await request(dishes, 400, "POST", { ...data, category_id: 999 });
  await request(dishes, 400, "POST", {
    ...data,
    photo: "data:image/png;base64,YQ==",
  });
  const photo =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB9sAAAAASUVORK5CYII=";
  const dish = await request(dishes, 201, "POST", { ...data, photo });
  const otherCategory = await request(categories, 201, "POST", {
    name: "Sobremesas",
  });
  assert.deepEqual(
    await request(dishes + "?categoria=" + otherCategory.id, 200),
    [],
  );
  const otherDish = await request(dishes, 201, "POST", {
    name: "Pudim",
    description: "Fatia individual",
    cents: 800,
    category_id: otherCategory.id,
  });
  const filtered = await request(
    dishes + "?categoria=" + category.id,
    200,
    "GET",
    undefined,
    false,
  );
  assert.deepEqual(
    filtered.map((item) => item.name),
    ["Penne"],
  );
  assert.equal(filtered[0].category, "Massas frescas");
  assert.equal(filtered[0].photo, photo);
  const updated = await request(dishes + "/" + dish.id, 200, "PUT", {
    ...data,
    cents: 2490,
  });
  assert.equal(updated.cents, 2490);
  assert.equal(updated.photo, photo);
  await request(dishes + "/" + dish.id, 200, "PUT", {
    ...data,
    category_id: otherCategory.id,
  });
  assert.deepEqual(
    await request(dishes + "?categoria=" + category.id, 200),
    [],
  );
  const movedDishes = await request(
    dishes + "?categoria=" + otherCategory.id,
    200,
  );
  assert.deepEqual(movedDishes.map(({ id }) => id), [dish.id, otherDish.id]);
  assert.ok(movedDishes.every(({ category }) => category === "Sobremesas"));
  await request(dishes + "/" + dish.id, 200, "PUT", data);
  await request(categories + "/" + category.id, 409, "DELETE");
  await request(dishes + "/" + dish.id, 204, "DELETE");
  await request(categories + "/" + category.id, 204, "DELETE");
  await request(dishes + "/" + otherDish.id, 204, "DELETE");
  await request(categories + "/" + otherCategory.id, 204, "DELETE");
  assert.deepEqual(await request(dishes, 200, "GET", undefined, false), []);
});
