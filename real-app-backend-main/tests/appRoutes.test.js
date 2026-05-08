const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../app");

const invokeApp = (method, url) =>
  new Promise((resolve, reject) => {
    const server = http.createServer(app);

    server.listen(0, async () => {
      const { port } = server.address();

      try {
        const response = await fetch(`http://127.0.0.1:${port}${url}`, { method });
        const body = await response.json();
        resolve({ statusCode: response.status, body });
      } catch (error) {
        reject(error);
      } finally {
        server.close();
      }
    });
  });

test("GET / returns the root health payload", async () => {
  const result = await invokeApp("GET", "/");

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, {
    status: "ok",
    message: "Creapy API is running.",
  });
});

test("GET /api/v1 returns the API base health payload", async () => {
  const result = await invokeApp("GET", "/api/v1");

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, {
    status: "ok",
    message: "Creapy API v1 is running.",
  });
});
