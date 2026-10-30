const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    status: "online",
    app: "Horizon TV",
    message: "Horizon backend is running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Horizon server running on port ${PORT}`);
});
