const request = require("supertest");
const { createApp } = require("../src/app");
const { pool, migrate } = require("../src/db");

const app = createApp();

beforeAll(async () => {
  await migrate();
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  await pool.query("DELETE FROM links");
});

describe("POST /api/links", () => {
  it("creates a short code for a valid URL", async () => {
    const res = await request(app)
      .post("/api/links")
      .send({ url: "https://www.kth.se" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body.code).toMatch(/^[A-Za-z0-9_-]{7}$/);
    expect(res.body.url).toBe("https://www.kth.se");
  });

  it("rejects a missing or malformed url", async () => {
    const res = await request(app).post("/api/links").send({}).set("Content-Type", "application/json");
    expect(res.status).toBe(400);
  });
});

describe("GET /:code", () => {
  it("redirects to the original URL", async () => {
    const create = await request(app)
      .post("/api/links")
      .send({ url: "https://www.kth.se/social/course/DD2482" })
      .set("Content-Type", "application/json");

    const res = await request(app).get(`/${create.body.code}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://www.kth.se/social/course/DD2482");
  });

  it("returns 404 for an unknown code", async () => {
    const res = await request(app).get("/doesnotexist");
    expect(res.status).toBe(404);
  });
});

describe("GET /health", () => {
  it("returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });
});