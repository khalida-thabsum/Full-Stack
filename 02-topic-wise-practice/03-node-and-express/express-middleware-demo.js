// Express middleware: request id, response time, CORS, authentication, role-based authorisation,
// async error handling and form-data parsing.
const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = 3101;

// Fake users and tokens (a real app would use a database and JWT)
const tokens = {
  "student-token": { name: "Asha", role: "student" },
  "warden-token": { name: "Mr. Rao", role: "warden" },
  "admin-token": { name: "Admin", role: "admin" }
};

// 1. Give every request an id and print one log line when it finishes
app.use((req, res, next) => {
  req.id = crypto.randomUUID().slice(0, 8);
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`[${req.id}] ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${ms.toFixed(1)}ms`);
  });
  res.set("X-Request-Id", req.id);
  next();
});

// 2. CORS headers so a page on another origin can call this API
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET, POST, DELETE");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// 3. Body parsers for JSON and HTML form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Authentication: reads "Authorization: Bearer <token>"
function authenticate(req, res, next) {
  const [scheme, token] = (req.get("Authorization") || "").split(" ");
  const user = scheme === "Bearer" && tokens[token];
  if (!user) return res.status(401).json({ error: "Login required" });
  req.user = user;
  next();
}

// 5. Authorisation: only the listed roles may continue
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Role '${req.user.role}' cannot do this` });
  }
  next();
};

// 6. Wrapper so errors thrown in async handlers reach the error middleware
const asyncRoute = fn => (req, res, next) => fn(req, res, next).catch(next);
const wait = ms => new Promise(r => setTimeout(r, ms));

app.get("/", (req, res) => res.json({ message: "Public route", requestId: req.id }));

app.get("/me", authenticate, (req, res) => res.json(req.user));

app.get("/reports", authenticate, authorize("warden", "admin"), (req, res) => {
  res.json({ report: "Hostel occupancy 92%", viewedBy: req.user.name });
});

app.delete("/users/:id", authenticate, authorize("admin"), (req, res) => {
  res.json({ deleted: req.params.id });
});

app.post("/feedback", (req, res) => {
  // Works for both JSON and form-encoded bodies
  res.json({ received: req.body, type: req.is("json") ? "json" : "form" });
});

app.get("/slow", asyncRoute(async (req, res) => {
  await wait(300);
  throw new Error("The slow route failed after 300ms");
}));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, requestId: req.id });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Middleware demo on http://localhost:${PORT}`));
}
module.exports = app;
