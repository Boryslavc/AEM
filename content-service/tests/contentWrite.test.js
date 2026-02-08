const request = require("supertest");
const express = require("express");
const routes = require("../routes/content");
require("./setup"); // Import the mock setup

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/content", routes);
  return app;
}

describe("Content Write APIs", () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  test("creates a new page", async () => {
    const res = await request(app)
      .post("/content")
      .send({
        contentType: "article",
        contentName: "new-page",
        initialVersion: {
          version: "v1",
          content: { title: "New Page" }
        }
      });

    expect(res.statusCode).toBe(201);
  });

  test("prevents duplicate page creation", async () => {
    await request(app).post("/content").send({
      contentType: "article",
      contentName: "duplicate",
      initialVersion: { version: "v1", content: {} }
    });

    const res = await request(app).post("/content").send({
      contentType: "article",
      contentName: "duplicate",
      initialVersion: { version: "v1", content: {} }
    });

    expect(res.statusCode).toBe(409);
  });

  test("creates a new version", async () => {
    const res = await request(app)
      .post("/content/article/getting-started/versions")
      .send({
        version: "v3",
        content: { title: "Third version" }
      });

    expect(res.statusCode).toBe(201);
  });

  test("deletes a page", async () => {
      const res = await request(app)
        .delete("/content/article/getting-started");

      expect(res.statusCode).toBe(204);
  });

  test("task queue works", async () => {
    await request(app).post("/content").send({
      contentType: "article",
      contentName: "some-article",
      initialVersion: { version: "v1", content: { title : "Test"} }
    });

    //simulate delayed response
    await new Promise(resolve => setTimeout(resolve, 1000));

    const res = await request(app).get("/content/article/some-article/v1" )
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Test");
  })
});
