import { test } from "node:test";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import assert from "node:assert/strict";

const execute = promisify(execFile);
const projectDirectory = fileURLToPath(new URL("../", import.meta.url));

test("entrada exporta o app sem abrir porta e atende páginas, arquivos e API", async () => {
  const directory = await mkdtemp(join(tmpdir(), "marmitaria-entrypoint-"));
  try {
    await execute(process.execPath, ["--input-type=module", "-e", `
      import assert from "node:assert/strict";
      import { once } from "node:events";
      import app from "./src/app.js";

      assert.equal(typeof app, "function");
      const server = app.listen(0, "127.0.0.1");
      await once(server, "listening");
      const base = "http://127.0.0.1:" + server.address().port;
      try {
        for (const [path, type] of [
          ["/", "text/html"],
          ["/style.css", "text/css"],
          ["/menu.js", "javascript"],
          ["/admin.js", "javascript"],
          ["/admin-form.js", "javascript"],
          ["/admin-view.js", "javascript"],
          ["/shared.js", "javascript"],
          ["/api/categorias", "application/json"],
          ["/api/pratos", "application/json"],
        ]) {
          const response = await fetch(base + path);
          assert.equal(response.status, 200, path);
          assert.ok(response.headers.get("content-type").includes(type), path);
          const content = await response.text();
          assert.ok(content.length > 0, path);
          if (path === "/") {
            assert.ok(content.includes('href="/style.css"'));
            assert.ok(content.includes('src="/menu.js"'));
          }
        }
        assert.equal((await fetch(base + "/admin")).status, 401);
        const authorization = "Basic " + Buffer.from("admin:senha-do-teste-123").toString("base64");
        const response = await fetch(base + "/admin", { headers: { authorization } });
        assert.equal(response.status, 200);
        const content = await response.text();
        assert.ok(content.includes('src="/admin.js"'));
        assert.ok(content.includes('href="/style.css"'));
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    `], {
      cwd: projectDirectory,
      env: {
        ...process.env,
        NODE_ENV: "production",
        VERCEL: "1",
        DB_PATH: join(directory, "catalog.sqlite"),
        ADMIN_USER: "admin",
        ADMIN_PASSWORD: "senha-do-teste-123",
      },
      timeout: 15_000,
      windowsHide: true,
    });
  } finally {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    await rm(directory, { recursive: true, force: true });
  }
});
