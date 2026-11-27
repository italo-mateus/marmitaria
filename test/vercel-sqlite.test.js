import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const entrypoint = new URL("../src/app.js", import.meta.url).href;
const seedPath = fileURLToPath(new URL("../data/marmitaria.sqlite", import.meta.url));

test("Vercel usa cópia temporária do banco sem sobrescrever os cadastros existentes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "marmitaria-vercel-"));
  try {
    const workingDirectory = join(directory, "workspace");
    const temporaryDirectory = join(directory, "temporary");
    await mkdir(workingDirectory);
    await mkdir(temporaryDirectory);
    await writeFile(join(workingDirectory, "data"), "não modificar");
    const originalSeed = await readFile(seedPath);
    const seed = new DatabaseSync(seedPath, { readOnly: true });
    const categoryCount = seed.prepare("SELECT COUNT(*) AS total FROM categories").get().total;
    const dishCount = seed.prepare("SELECT COUNT(*) AS total FROM dishes").get().total;
    seed.close();
    const environment = {
      ...process.env,
      NODE_ENV: "production",
      VERCEL: "1",
      TMPDIR: temporaryDirectory,
      TMP: temporaryDirectory,
      TEMP: temporaryDirectory,
      ADMIN_USER: "admin",
      ADMIN_PASSWORD: "senha-do-teste-123",
      MARMITARIA_ENTRYPOINT: entrypoint,
      MARMITARIA_CATEGORY: "Teste " + randomUUID(),
      MARMITARIA_CATEGORY_COUNT: String(categoryCount),
      MARMITARIA_DISH_COUNT: String(dishCount),
    };
    delete environment.DB_PATH;
    for (const phase of ["create", "reuse"]) {
      await execute(process.execPath, ["--input-type=module", "-e", `
        import assert from "node:assert/strict";
        import { once } from "node:events";
        import { existsSync } from "node:fs";
        import { tmpdir } from "node:os";
        import { join } from "node:path";

        const { default: app } = await import(process.env.MARMITARIA_ENTRYPOINT);
        assert.ok(existsSync(join(tmpdir(), "marmitaria.sqlite")));
        const server = app.listen(0, "127.0.0.1");
        await once(server, "listening");
        const base = "http://127.0.0.1:" + server.address().port;
        try {
          const page = await fetch(base + "/");
          assert.equal(page.status, 200);
          await page.text();
          const dishes = await fetch(base + "/api/pratos");
          assert.equal(dishes.status, 200);
          assert.equal((await dishes.json()).length, Number(process.env.MARMITARIA_DISH_COUNT));
          const response = await fetch(base + "/api/categorias");
          assert.equal(response.status, 200);
          const categories = await response.json();
          const name = process.env.MARMITARIA_CATEGORY;
          if (process.env.MARMITARIA_TEST_PHASE === "create") {
            assert.equal(categories.length, Number(process.env.MARMITARIA_CATEGORY_COUNT));
            const created = await fetch(base + "/api/categorias", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Basic " + Buffer.from("admin:senha-do-teste-123").toString("base64"),
              },
              body: JSON.stringify({ name }),
            });
            assert.equal(created.status, 201);
            assert.equal((await created.json()).name, name);
          } else {
            assert.ok(categories.some((category) => category.name === name));
          }
        } finally {
          await new Promise((resolve) => server.close(resolve));
        }
      `], {
        cwd: workingDirectory,
        env: { ...environment, MARMITARIA_TEST_PHASE: phase },
        timeout: 15_000,
        windowsHide: true,
      });
    }
    assert.deepEqual(await readFile(seedPath), originalSeed);
    assert.equal(await readFile(join(workingDirectory, "data"), "utf8"), "não modificar");
  } finally {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    await rm(directory, { recursive: true, force: true });
  }
});
