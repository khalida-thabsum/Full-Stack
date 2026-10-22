## Assignment 2 - Hostel Complaint API

A REST API where hostel students raise complaints, the warden assigns them to maintenance staff with the right skill, and staff work them through to resolution. Built with Express and MongoDB (Mongoose).

### Design
- **Layers:** routes &rarr; controllers (HTTP only) &rarr; service (all business rules) &rarr; Mongoose models
- **Who is calling:** the `X-User-Id` header identifies the user; middleware loads the user and checks the role. A real deployment would replace this with login and JWT.
- **Status workflow:** `Open → Assigned → InProgress → Resolved → Closed`. The warden can send an Assigned complaint back to Open, and a student can reopen a Resolved one. Each move is checked against the allowed-transition table and the caller's role, and is recorded in `history`.
- **Due dates:** priority sets a deadline (Urgent 6 h, High 24 h, Medium 72 h, Low 120 h); `?overdue=true` lists late complaints.
- **Ticket numbers** like `HC-2026-0007` come from a counter collection.

### Endpoints (prefix `/api`)
| Method | Path | Who |
|---|---|---|
| POST | /users | anyone (demo sign-up) |
| GET | /users?role=&skill= | warden |
| GET | /users/me | any user |
| POST | /complaints | student |
| GET | /complaints?status=&category=&priority=&overdue=&sort=&page=&limit= | everyone; students see their own, staff see theirs |
| GET | /complaints/:id | owner, assigned staff, warden |
| DELETE | /complaints/:id | student, only while Open |
| PATCH | /complaints/:id/assign `{ staffId }` | warden |
| PATCH | /complaints/:id/status `{ status }` | depends on the transition |
| POST | /complaints/:id/comments `{ text }` | owner, assigned staff, warden |
| POST | /complaints/:id/rating `{ rating }` | student, after closing |
| GET | /complaints/summary | warden (aggregation dashboard) |

Errors always come back as `{ "error": { "message": ..., "fields": {...} } }` with 400, 401, 403, 404, 409, 422 or 500.

### Run it
```
cp .env.example .env
npm install
npm run seed     # prints user ids to use in X-User-Id
npm start
```
In a second terminal, `npm run smoke` walks one complaint through its whole life cycle and checks 27 rules.

Postman screenshots go in `screenshots/`.
