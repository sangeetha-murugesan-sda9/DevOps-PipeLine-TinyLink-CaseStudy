const express = require("express");
const path = require("path");
const { pool } = require("./db");
const { generateCode } = require("./codes");

function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.sendStatus(200));

  app.post("/api/links", async (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "url must be an absolute http(s) URL" });
    }

    const code = generateCode();
    await pool.query("INSERT INTO links (code, url) VALUES ($1, $2)", [code, url]);
    res.status(201).json({ code, url });
  });

  app.get("/api/links", async (_req, res) => {
    const { rows } = await pool.query(
      "SELECT code, url, created_at FROM links ORDER BY created_at DESC LIMIT 50"
    );
    res.json(rows);
  });

  app.get("/:code", async (req, res, next) => {
    if (req.params.code.includes(".")) return next(); // static file, not a code

    const { rows } = await pool.query("SELECT url FROM links WHERE code = $1", [req.params.code]);
    if (!rows.length) return res.sendStatus(404);
    res.redirect(rows[0].url);
  });

  app.use(express.static(path.join(__dirname, "..", "public"))); // built React app, see Dockerfile

  return app;
}

module.exports = { createApp };