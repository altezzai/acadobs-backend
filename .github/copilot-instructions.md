<!-- Copilot / AI agent instructions for contributors to this repo -->

# Quick Orientation
- **Purpose:** Backend API for a school-management app (Express + Sequelize + MySQL).
- **Entry point:** `app.js` (server, middleware registration, socket hookup).
- **DB layer:** Sequelize models live in `models/`, migrations in `migrations/` (timestamp-prefixed), and config in `config/` (`config/config.json`, `connection.js`).

# How to run (developer)**
- Use the npm scripts from `package.json`: `npm run dev` (uses `nodemon app.js`) and `npm run migrate` for applying migrations (`npx sequelize-cli db:migrate`).
- Environment: `.env` values are consumed via `dotenv` (database creds, Firebase keys). The project also includes `serviceAccountKey.json` for Firebase admin usage in `config/firebase.js`.

# Architecture and patterns (what to know)
- Controllers: `controllers/*Controller.js` implement REST endpoints and return JSON consistently. Responses often follow pagination schema: `res.status(...).json({ totalcontent, totalPages, currentPage, <resource> })`.
- Models & soft-deletes: Many models use a `trash` boolean for soft-deletes. CRUD handlers typically check `trash: false` when listing and use `trash: true` to soft-delete.
- Transactions: For multi-step writes (e.g., creating staff, bulk students, duties) controllers use `schoolSequelize.transaction()` from `config/connection.js`. Preserve transaction scope when adding related DB writes.
- File handling: Image/files use `multer` and helpers in `utils/fileHandler` (`compressAndSaveFile`, `compressAndSaveMultiFile`, `deletefilewithfoldername`). Upload paths commonly include `uploads/dp/`, `uploads/students_images/`, `uploads/duties/`.
- Auth & roles: Middleware files in `middlewares/` (e.g., `authMiddleware.js`, `adminMiddleware.js`, `staffMiddleware.js`, `guardianMiddleware.js`) enforce authentication and role-based access. Use `req.user.school_id` — controllers expect `req.user` to be present after `authMiddleware`.
- Socket / realtime: `socketHandlers/` holds socket.io handlers; `socket.io` is a runtime dependency. When changing realtime behavior, update both `app.js` and `socketHandlers/` consistently.

# Conventions & idioms to follow
- Pagination params: controllers accept `page` and `limit` query params; default is `page=1, limit=10`. When `download=true` some endpoints bypass pagination.
- Search filters: Many endpoints accept `q` or other query parameters and use Sequelize `Op.like` for case-insensitive searches: e.g., `{ name: { [Op.like]: `%${q}%` } }`.
- Error responses: Prefer `res.status(<code>).json({ error: <message> })`. Controllers usually log server errors and return `500` with `err.message` for debugging.
- ID checks: Use `findOne`/`findByPk` and return `404` when the resource isn't found; don't assume existence.

# Important files to inspect when making changes
- `app.js` — server setup, middleware order, routes mounting, socket instantiation.
- `config/connection.js` — Sequelize instances and exported `schoolSequelize` used for transactions.
- `controllers/` — most business logic; when adding endpoints, follow existing patterns for pagination, soft-delete, and transactions.
- `models/` — Sequelize model definitions; new columns or relations must be reflected in `migrations/`.
- `migrations/` — timestamped files; update using `sequelize-cli` and add matching migration files for schema changes.
- `middlewares/` — auth and role checks. If adding protected routes, add middleware to the route definitions.
- `utils/fileHandler.js` (and other `utils/`) — reuse file helpers for uploads rather than adding ad-hoc file IO.

# External integrations
- Firebase: `config/firebase.js` + `serviceAccountKey.json` — used for notifications (FCM). Keep keys private; do not commit new service account JSON to repo.
- Email/SMS: Not present by default — search `utils/` or `controllers/` if integrating new delivery channels.

# DB workflow & migration notes
- Apply migrations with `npm run migrate` (wrap in environment variables for the target DB). Migrations follow `YYYYMMDDHHmmss-create-*.js` pattern.
- When creating or renaming models, always add a migration to preserve production schema updates.

# Tests & CI
- There are no unit tests in the repo. If adding tests, follow node/express patterns and add `test` script in `package.json`. Keep tests isolated from production DB (use a test database or in-memory mock).

# Safety & secrets
- `serviceAccountKey.json` exists — do not commit new copies or print this file's content. Use environment-based secrets for CI/deploy.

# Quick examples (copyable patterns)
- Pagination response:
  res.status(200).json({ totalcontent: count, totalPages: Math.ceil(count/limit), currentPage: page, items });
- Soft delete pattern:
  await Model.update({ trash: true }, { where: { id } });
- Transaction pattern:
  const transaction = await schoolSequelize.transaction();
  try { /* create multiple related rows */ await transaction.commit(); } catch (e) { await transaction.rollback(); }

# If you are the AI agent editing code
- Follow existing controller structure and response formats. Minimal, focused changes are preferred.
- Reuse helpers from `utils/` and middlewares in `middlewares/`.
- When adding DB fields, add a migration in `migrations/` and update the matching `models/` file.

If anything in this instruction file seems incorrect or incomplete for your intended change, tell me which area to expand (run/dev, DB, file uploads, auth, or socket handlers) and I'll iterate.
