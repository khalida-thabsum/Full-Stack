## Node.js and Express

**basic-http-server.js** (port 3100, `npm run http`): routing with the `URL` class, a unit-converter API using query parameters, streaming a file with `fs.createReadStream().pipe()`, 405 for non-GET requests, and server events.

**express-middleware-demo.js** (port 3101, `npm run middleware`): request id and timing, CORS headers, JSON and form parsing, Bearer-token authentication and role-based authorisation (`student-token`, `warden-token`, `admin-token`), and an async error wrapper.

**rest-api-crud.js** (port 3102, `npm run crud`): blood donor directory built on `express.Router` with `router.param`, filters, pagination, a per-group summary, 90-day donation eligibility and full CRUD.

Run `npm install` first.
