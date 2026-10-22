// REST API for a blood donor directory using express.Router (in-memory data)
const express = require("express");

const app = express();
const PORT = 3102;
app.use(express.json());

const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
let donors = [
  { id: 1, name: "Ravi Kumar", group: "O+", city: "Visakhapatnam", phone: "9000000001", lastDonated: "2026-05-10" },
  { id: 2, name: "Sameera", group: "B+", city: "Vijayawada", phone: "9000000002", lastDonated: "2026-08-21" },
  { id: 3, name: "Imran", group: "O-", city: "Visakhapatnam", phone: "9000000003", lastDonated: "2026-01-15" },
  { id: 4, name: "Lavanya", group: "A+", city: "Guntur", phone: "9000000004", lastDonated: null }
];
let nextId = 5;

// A donor can give blood again 90 days after the last donation
const isEligible = d => !d.lastDonated || (Date.now() - new Date(d.lastDonated)) / 864e5 >= 90;
const withEligibility = d => ({ ...d, eligible: isEligible(d) });

function validate(body, partial) {
  const errors = [];
  const has = k => body[k] !== undefined;
  if ((!partial || has("name")) && !(typeof body.name === "string" && body.name.trim().length >= 2)) errors.push("name must have at least 2 characters");
  if ((!partial || has("group")) && !GROUPS.includes(body.group)) errors.push(`group must be one of ${GROUPS.join(" ")}`);
  if ((!partial || has("city")) && !(typeof body.city === "string" && body.city.trim())) errors.push("city is required");
  if ((!partial || has("phone")) && !/^[6-9]\d{9}$/.test(body.phone || "")) errors.push("phone must be a 10-digit mobile number");
  if (has("lastDonated") && body.lastDonated !== null && Number.isNaN(Date.parse(body.lastDonated))) errors.push("lastDonated must be a date");
  return errors;
}

const router = express.Router();

// Load the donor for any route with :id
router.param("id", (req, res, next, id) => {
  req.donor = donors.find(d => d.id === Number(id));
  if (!req.donor) return res.status(404).json({ error: `No donor with id ${id}` });
  next();
});

// GET /api/donors?group=O%2B&city=Visakhapatnam&eligible=true&page=1&limit=2
router.get("/", (req, res) => {
  const { group, city, eligible } = req.query;
  let list = donors.map(withEligibility);
  if (group) list = list.filter(d => d.group === group);
  if (city) list = list.filter(d => d.city.toLowerCase() === city.toLowerCase());
  if (eligible) list = list.filter(d => d.eligible === (eligible === "true"));
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 10);
  res.json({ total: list.length, page, data: list.slice((page - 1) * limit, page * limit) });
});

// GET /api/donors/summary - count of donors per blood group
router.get("/summary", (req, res) => {
  const summary = Object.fromEntries(GROUPS.map(g => [g, donors.filter(d => d.group === g).length]));
  res.json(summary);
});

router.get("/:id", (req, res) => res.json(withEligibility(req.donor)));

router.post("/", (req, res) => {
  const errors = validate(req.body, false);
  if (errors.length) return res.status(400).json({ errors });
  if (donors.some(d => d.phone === req.body.phone)) return res.status(409).json({ error: "A donor with this phone already exists" });
  const donor = { id: nextId++, name: req.body.name.trim(), group: req.body.group, city: req.body.city.trim(), phone: req.body.phone, lastDonated: req.body.lastDonated || null };
  donors.push(donor);
  res.status(201).json(withEligibility(donor));
});

router.put("/:id", (req, res) => {
  const errors = validate(req.body, false);
  if (errors.length) return res.status(400).json({ errors });
  Object.assign(req.donor, { name: req.body.name.trim(), group: req.body.group, city: req.body.city.trim(), phone: req.body.phone, lastDonated: req.body.lastDonated || null });
  res.json(withEligibility(req.donor));
});

// POST /api/donors/:id/donations - record that the donor gave blood today
router.post("/:id/donations", (req, res) => {
  if (!isEligible(req.donor)) return res.status(409).json({ error: "Donor is not eligible yet (90-day gap)" });
  req.donor.lastDonated = new Date().toISOString().slice(0, 10);
  res.status(201).json(withEligibility(req.donor));
});

router.delete("/:id", (req, res) => {
  donors = donors.filter(d => d !== req.donor);
  res.json({ message: `Removed ${req.donor.name}` });
});

app.use("/api/donors", router);
app.use((req, res) => res.status(404).json({ error: "Not found" }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Donor API on http://localhost:${PORT}/api/donors`));
}
module.exports = app;
