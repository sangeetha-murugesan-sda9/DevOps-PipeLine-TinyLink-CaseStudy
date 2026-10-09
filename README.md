# TinyLink

*KTH DD2482 DevOps project*

TinyLink is a small URL-shortening service: paste a long URL (optionally with a custom alias) and get a short link that redirects to it, plus a QR code for the link. It exists to give a complete DevOps pipeline something real to build, test, scan and deploy. The pipeline around the app is the subject of this repository.

- **Backend:** Node.js / Express REST API (`server/`)
- **Frontend:** React + Vite single-page app (`client/`)
- **Database:** PostgreSQL
- **Packaging:** one multi-stage Docker image. The React app is compiled in a build stage and Express serves the static files and the API from the same container.
- **Live deployment:** Render web service backed by a Neon Postgres database. The current URL is shown as **Live URL** on the summary page of the latest **CD** run (Actions tab) and in the Render dashboard. It changes on every deployment, because Render's free tier cannot update a service in place, so each deploy replaces the service and gets a new address. The link at submission time is: https://[https://tinylink-ru43.onrender.com](https://tinylink-ru43.onrender.com). The service is on a free tier, so the first request after 15 minutes of inactivity can take about a minute.

## Architecture

![TinyLink architecture](assets/architecture.png)

| Concern | What is used |
|---|---|
| CI | GitHub Actions, `.github/workflows/ci.yml` |
| CD | GitHub Actions, `.github/workflows/cd.yml` |
| Infrastructure as code | Terraform in `infra/terraform/` (Render and Neon providers, remote state in HCP Terraform) |
| Container registry | GitHub Container Registry (GHCR) |
| Quality / security automation | SonarCloud (static analysis + quality gate) and Renovate (dependency update PRs) |
| Platform | GitHub, with a ruleset on `main` requiring a pull request and the CI check to pass |

### CI (`ci.yml`)

Runs on every pull request to `main` (and on pushes to `main`). It installs dependencies, lints both workspaces, runs the backend and frontend tests (the backend tests use a real Postgres 16 service container, not a mock), runs the SonarCloud scan against its quality gate, and builds the Docker image without pushing it. A PR cannot be merged until this check passes.

### CD (`cd.yml`)

Runs only after a merge to `main` (or manually through *Run workflow*). It builds the image, pushes it to GHCR tagged with the commit SHA, runs `terraform apply` so that the Render service runs exactly that image, reads the service URL from the Terraform output, and finally calls `GET /health` on the new deployment as a smoke test.

CD runs are queued (`concurrency`), so two deployments never run at the same time. Pushes that change only `README.md`, `report.md` or `assets/` do not trigger CD, so documentation updates do not redeploy the app or change its URL. Each run prints the deployed URL and shows it as **Live URL** on the run's summary page.

### Infrastructure (`infra/terraform/`)

| File | Purpose |
|---|---|
| `providers.tf` | Provider versions, Render/Neon provider configuration, HCP Terraform backend |
| `variables.tf` | API keys and the image reference, all passed in from CI |
| `main.tf` | `neon_project` (database) and `render_web_service` (the container) |
| `outputs.tf` | `service_url`, used by the smoke test |

State is stored remotely in HCP Terraform, so each CI run starts from the real state. Two behaviours are worth knowing:

- The Render provider cannot update a free-tier service in place (it fails with *"maintenance mode can only be configured for non-free tier services"*). `main.tf` therefore replaces the service whenever the image tag changes (`terraform_data` + `replace_triggered_by`).
- Neon requires an `org_id`, and the free plan caps `history_retention_seconds` at 21600. Both are set explicitly.

### Dependency management (`renovate.json`)

Renovate opens pull requests for npm packages (client and server), the Dockerfile base image, GitHub Actions and Terraform providers. Each one goes through the same CI gate as any other change. Minor and patch updates are eligible for automerge, and **major updates are disabled** on purpose, because they can contain breaking changes and are better reviewed by hand. For example, an early `jsdom` v30 PR failed CI and was closed.

## Repository layout

```
client/                  React + Vite frontend
server/                  Express API, database access, tests
infra/terraform/         Terraform for Render + Neon
.github/workflows/       ci.yml, cd.yml
assets/                  Images used in this README
Dockerfile               multi-stage build (frontend build, then runtime image)
sonar-project.properties SonarCloud configuration
renovate.json            Renovate policy
```

## Running it locally

Prerequisites: Node.js 20, npm, and Docker (for a local Postgres).

```bash
# 1. Start Postgres
docker run -d --name tinylink-db -p 5432:5432 \
  -e POSTGRES_USER=tinylink -e POSTGRES_PASSWORD=tinylink -e POSTGRES_DB=tinylink \
  postgres:16

# 2. Configure the backend
cp server/.env.example server/.env      # DATABASE_URL, PGSSL=false, PORT=3000

# 3. Install and run
npm ci
npm run dev --workspace server           # API on http://localhost:3000
npm run dev --workspace client           # UI on http://localhost:5173
```

Note: a short link such as `http://localhost:3000/<code>` redirects through the backend on port 3000. The Vite dev server (5173) only serves the UI. In the deployed container, one Express server on one port serves both.

Useful commands:

```bash
npm run lint      # lint both workspaces
npm test          # run backend (Jest) and frontend (Vitest) tests; needs Postgres for backend
npm run build     # build the frontend
```

Run the production image locally:

```bash
docker build -t tinylink .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgresql://tinylink:tinylink@host.docker.internal:5432/tinylink \
  -e PGSSL=false tinylink
```

### API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/links` | Create a short link. Body: `{ "url": "...", "alias": "optional" }`. Aliases must be at least 5 characters and unique. |
| `GET` | `/api/links` | List links |
| `GET` | `/:code` | Redirect to the original URL (404 if unknown) |
| `GET` | `/health` | Health check, returns 200 (used by the CD smoke test) |

## Setting up the pipeline in a fork

You need accounts on SonarCloud, Render, Neon and HCP Terraform, and the Renovate GitHub App installed. Then add these **repository secrets** (names only, never commit values):

| Secret | Used for |
|---|---|
| `SONAR_TOKEN` | SonarCloud scan in CI |
| `TF_API_TOKEN` | HCP Terraform authentication in CD (exposed to Terraform as `TF_TOKEN_app_terraform_io`) |
| `RENDER_API_KEY` | Render provider |
| `RENDER_OWNER_ID` | Render owner / workspace ID |
| `NEON_API_KEY` | Neon provider |

`GITHUB_TOKEN` is provided automatically. You also need to set the Neon `org_id` in `infra/terraform/main.tf`, the HCP Terraform organization/workspace in `providers.tf`, and the SonarCloud organization and project key in `sonar-project.properties`.

Recommended repository setting: a ruleset on `main` that requires a pull request and the `build-and-test` check.

## Limitations

Limitations and trade-offs are described in Section 5 of the project report.

## AI-assisted tools

The use of an AI assistant is documented in Section 4 of the project report.

