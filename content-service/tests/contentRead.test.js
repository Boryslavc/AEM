const request = require("supertest");
const express = require("express");
const route = require("../routes/content");

jest.mock('../utils/taskQueue');

require("./setup");

function createTestApp(){
    const app = express();
    app.use(express.json());
    app.use("/content", route);
    return app;
}

describe("Content service API - Page Read", () =>{
    let app;

    beforeEach(()=>{
        app = createTestApp();
    });

    test("Returns page for valid client/lang/version", async () =>{
        const res = await request(app).get("/content/pages/client1/en/v1/home");

        expect(res.status).toBe(200);
        expect(res.text).toContain("Home Page");
        expect(res.headers['x-client']).toBe('client1');
        expect(res.headers['x-language']).toBe('en');
        expect(res.headers['x-version']).toBe('v1');
    });

    test("returns 404 for unknown page", async () => {
        const res = await request(app).get("/content/pages/client1/en/v1/unknown");

        expect(res.statusCode).toBe(404);
        expect(res.text).toBe("Page not found");
    });

    test("returns 404 for unknown version", async () => {
        const res = await request(app)
        .get("/content/pages/client1/en/v99/home");

        expect(res.statusCode).toBe(404);
    });
});