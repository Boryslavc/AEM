const request = require("supertest");
const express = require("express");
const axios = require("axios");
const proxyRoute = require("../routes/proxy");
const cache = require("../cache/memoryCache");

jest.mock("axios");

function createEdgeApp() {
  const app = express();
  app.use("/", proxyRoute);
  return app;
}

describe("Edge Cache behavior", () => {
  let app;

  beforeEach(() => {
    app = createEdgeApp();
    jest.clearAllMocks();
    cache.clear();
  });

  test("cache MISS on first request", async () => {
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: { title: "Getting started" },
      headers: { "content-type": "application/json" }
    });

    const res = await request(app).get("/content/article/getting-started/v1");

    expect(res.statusCode).toBe(200);
    expect(res.headers["x-cache"]).toBe("MISS");
  });

  test("cache HIT on second request", async () => {
    axios.get.mockResolvedValue({
      status: 200,
      data: { title: "Home" },
      headers: { "content-type": "application/json" }
    });

    await request(app).get("/content/article/getting-started/v1");
    const res = await request(app).get("/content/article/getting-started/v1");

    expect(res.headers["x-cache"]).toBe("HIT");
  });

  test("returns 502 when origin fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Origin down"));

    const res = await request(app).get("/content/article/getting-started/v1");

    expect(res.statusCode).toBe(502);
    expect(res.body).toHaveProperty("error");
  });
});
