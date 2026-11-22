import { DatabaseSync } from "node:sqlite";

export function openCatalog(filename) {
  const database = new DatabaseSync(filename);
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      cents INTEGER NOT NULL CHECK (cents > 0),
      photo TEXT NOT NULL DEFAULT '',
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT
    );
  `);

  const categories = {
    list: () =>
      database
        .prepare("SELECT id, name FROM categories ORDER BY name_key")
        .all(),
    get: (id) =>
      database.prepare("SELECT id, name FROM categories WHERE id = ?").get(id),
    add: ({ name, key }) =>
      database
        .prepare("INSERT INTO categories (name, name_key) VALUES (?, ?)")
        .run(name, key).lastInsertRowid,
    update: (id, { name, key }) =>
      database
        .prepare("UPDATE categories SET name = ?, name_key = ? WHERE id = ?")
        .run(name, key, id),
    remove: (id) =>
      database.prepare("DELETE FROM categories WHERE id = ?").run(id),
  };
  const selectDishesQuery = `
      SELECT d.*, c.name AS category
      FROM dishes d
      JOIN categories c ON c.id = d.category_id
    `;
  const dishes = {
    list: (category) => {
      if (category) {
        return database
          .prepare(selectDishesQuery + " WHERE d.category_id = ? ORDER BY d.id")
          .all(category);
      }
      return database.prepare(selectDishesQuery + " ORDER BY d.id").all();
    },
    get: (id) =>
      database.prepare(selectDishesQuery + " WHERE d.id = ?").get(id),
    add: ({ name, description, cents, photo, category_id }) =>
      database
        .prepare(
          `
          INSERT INTO dishes (name, description, cents, photo, category_id)
          VALUES (?, ?, ?, ?, ?)
        `,
        )
        .run(name, description, cents, photo, category_id).lastInsertRowid,
    update: (id, { name, description, cents, photo, category_id }) =>
      database
        .prepare(
          `
          UPDATE dishes
          SET name = ?, description = ?, cents = ?, photo = ?, category_id = ?
          WHERE id = ?
        `,
        )
        .run(name, description, cents, photo, category_id, id),
    remove: (id) => database.prepare("DELETE FROM dishes WHERE id = ?").run(id),
  };
  return { categories, dishes, close: () => database.close() };
}
