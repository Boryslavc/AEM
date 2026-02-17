const request = require("supertest");
const express = require("express");
const routes = require("../routes/content");

jest.mock('../utils/taskQueue');

require("./setup");

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
      .post("/content/pages/client1/en/v2/about")
      .send({
        html: "<h1>About Page</h1>"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Page created");
    expect(res.body.path).toBe("/client1/en/v2/about");
  });

  test("prevents duplicate page creation", async () => {
    await request(app)
      .post("/content/pages/client1/en/v1/home")
      .send({ html: "<h1>Duplicate</h1>" });

    const res = await request(app)
      .post("/content/pages/client1/en/v1/home")
      .send({ html: "<h1>Duplicate</h1>" });

    expect(res.statusCode).toBe(400);
    expect(res.text).toBe("Page already exists");
  });

  test("updates an existing page", async () => {
    const res = await request(app)
      .put("/content/pages/client1/en/v1/home")
      .send({
        html: "<h1>Updated Home</h1>"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Page updated");
  });

  test("deletes a page", async () => {
    const res = await request(app)
      .delete("/content/pages/client1/en/v1/home");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Page deleted");
  });
});
