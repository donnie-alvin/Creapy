const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const loadApp = () => {
  delete require.cache[require.resolve("../app")];
  return require("../app");
};

const invokeApp = (method, url, { headers } = {}) =>
  new Promise((resolve, reject) => {
    const app = loadApp();
    const server = http.createServer(app);

    server.listen(0, async () => {
      const { port } = server.address();

      try {
        const response = await fetch(`http://127.0.0.1:${port}${url}`, {
          method,
          headers,
        });
        const contentType = response.headers.get("content-type") || "";
        const body = contentType.includes("application/json")
          ? await response.json()
          : await response.text();

        resolve({
          statusCode: response.status,
          body,
          headers: response.headers,
        });
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

test("GET / returns CORS headers for Amplify frontend origins", async () => {
  const result = await invokeApp("GET", "/", {
    headers: {
      Origin: "https://awsfullmig.d3j8az2psmt96w.amplifyapp.com",
    },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(
    result.headers.get("access-control-allow-origin"),
    "https://awsfullmig.d3j8az2psmt96w.amplifyapp.com"
  );
  assert.equal(result.headers.get("access-control-allow-credentials"), "true");
});

test("GET / returns CORS headers for Townruins custom domains", async () => {
  const result = await invokeApp("GET", "/", {
    headers: {
      Origin: "https://app.townruins.com",
    },
  });

  assert.equal(result.statusCode, 200);
  assert.equal(
    result.headers.get("access-control-allow-origin"),
    "https://app.townruins.com"
  );
  assert.equal(result.headers.get("access-control-allow-credentials"), "true");
});

test("OPTIONS preflight succeeds for configured frontend origins", async () => {
  process.env.FRONTEND_URL = "https://townruins.com";

  try {
    const result = await invokeApp("OPTIONS", "/api/v1/users/login", {
      headers: {
        Origin: "https://townruins.com",
        "Access-Control-Request-Method": "POST",
      },
    });

    assert.equal(result.statusCode, 204);
    assert.equal(
      result.headers.get("access-control-allow-origin"),
      "https://townruins.com"
    );
  } finally {
    delete process.env.FRONTEND_URL;
  }
});
