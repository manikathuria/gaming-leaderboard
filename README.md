# Gaming Leaderboard API

A **NestJS-based gaming leaderboard system** with **Prisma ORM**, **PostgreSQL**, and **Prometheus + Grafana monitoring**.
Supports score submissions, dynamic ranking, and top leaderboard queries — designed to scale up to millions of users.

---

## 📑 Features

* **Users**

  * Register new users (unique usernames).
  * CRUD operations.

* **Game Sessions**

  * Store each user’s score submissions.
  * Indexed for performance (user_id, timestamp).

* **Leaderboard**

  * Submit score → leaderboard auto-updates.
  * Fetch top 10 users by total score.
  * Get a specific user’s rank and total score.
  * Scalable rank calculation using **Postgres window functions**.

* **Monitoring & Logging**

  * Structured logs with **Winston logger**.
  * API-level request/response logging.
  * Metrics exposed via `/metrics` for Prometheus.
  * Pre-provisioned Grafana dashboards.

* **Developer Experience**

  * Swagger docs at `/docs`.
  * Prettier + ESLint.
  * Containerization.

---

## 📂 Tech Stack

* **Backend Framework**: [NestJS](https://nestjs.com/)
* **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
* **Monitoring**: Prometheus + Grafana
* **Containerization**: Docker & Docker Compose
* **Logging**: Winston (JSON structured logs)
* **Validation**: class-validator + DTOs
* **API Docs**: Swagger

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/gaming-leaderboard.git
cd gaming-leaderboard
```

### 2️⃣ Environment variables

Create a `.env` file in the root directory:

```env
# App
PORT=3002
NODE_ENV=development
DEBUG_PORT=9229

# Database
POSTGRES_DB=leaderboard_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/leaderboard_db

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
```

### 3️⃣ Run with Docker Compose

```bash
docker compose up --build
```

This will start:

* `leaderboard_app` (NestJS API at `http://localhost:3002`)
* `postgres` (database)
* `prometheus` (metrics at `http://localhost:9090`)
* `grafana` (dashboards at `http://localhost:3001`)

---

## 📑 API Endpoints

### Users

* `POST /api/v1/users` → create user
* `GET /api/v1/users` → list users
* `GET /api/v1/users/:id` → get user by ID

### Leaderboard

* `POST /api/v1/leaderboard/submit`
  Submit a score for a user. Returns updated score and rank.

* `GET /api/v1/leaderboard/top?limit=10`
  Fetch top N players (default 10).

* `GET /api/v1/leaderboard/rank/:user_id`
  Fetch rank and score for a specific user.

---

## 📊 Monitoring & Metrics

* **Prometheus** scrapes metrics from:

  ```
  http://localhost:3002/metrics
  ```

* **Grafana** available at:

  ```
  http://localhost:3001
  ```

  Login → `admin/admin`.
  Pre-provisioned dashboards: Node.js heap, GC, handles, active resources, request traffic.

---

## 🧪 Development

### Run locally (without Docker)

```bash
npm install
npx prisma migrate dev --name init
npm run start:dev
```

### Run migrations in Docker

Migrations are handled by the `migrate` service:

```bash
docker compose run migrate
```

### Prettier & ESLint

Format and lint code before commits:

```bash
npm run lint
npm run format
```

---

## 📜 Example Demo

Run included demo script to create users, submit scores, and query leaderboard:

```bash
./demo.sh
```

Output is logged to:

```
output/demo.txt
```

---

## 🚀 Future Enhancements

* [ ] Redis cache for faster leaderboard lookups.
* [ ] WebSocket updates for real-time rank changes.
* [ ] Multi-game support.
* [ ] Horizontal scaling (Kubernetes).

