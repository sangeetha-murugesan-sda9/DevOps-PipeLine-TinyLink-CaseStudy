require("dotenv").config();
const { createApp } = require("./app");
const { migrate } = require("./db");

const PORT = process.env.PORT || 3000;

migrate()
  .then(() => {
    createApp().listen(PORT, () => {
      console.log(`TinyLink server listening on :${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to run migration, exiting:", err);
    process.exit(1);
  });