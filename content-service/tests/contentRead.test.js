const request = require("supertest");
const express = require("express");
const route = require("../routes/content");
require("./setup");

function createTestApp(){
    const app = express();
    app.use("/content", route);
    return app;
}

describe("Content service API", () =>{
    let app;

    beforeEach(()=>{
        app = createTestApp();
    });

    test("Returns content for right version", async () =>{
        const res = await request(app).get("/content/article/getting-started/v1");

        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        expect(res.body).toHaveProperty("title");
    });

    test("returns 404 for unknown content", async () => {
        const res = await request(app)
        .get("/content/page/unknown/v1");

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty("error");
    });

  test("returns 404 for unknown version", async () => {
        const res = await request(app)
        .get("/content/page/home/invalid");

        expect(res.statusCode).toBe(404);
  });
});